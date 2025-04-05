from flask import Flask, jsonify, request
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import os
import glob
import serial
import struct
from Services.database_service import Database as db
import sqlite3
from flask_cors import CORS
import threading
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
from Models.ModbusDB.operating_data_table import OperatingData
import atexit

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MAX_RETRIES = 3  # Maximum number of connection attempts
RETRY_DELAY = 2  # Seconds between retries

# Create a single Flask app instance
app = Flask(__name__)
CORS(app)
modbus = None
rs485_connected = False

def cleanup_modbus():
    global modbus
    if modbus and hasattr(modbus, 'client'):
        try:
            modbus.client.close()
            info("Modbus connection closed during cleanup")
        except Exception as e:
            error(f"Error during Modbus cleanup: {str(e)}")

# Register the cleanup function
atexit.register(cleanup_modbus)

def run_server():
    global modbus, rs485_connected
    
    # Clean up any existing connection first
    cleanup_modbus()
    
    # Try to establish Modbus connection
    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            modbus = ModbusConnection()
            rs485_connected = True
            info("Successfully connected to RS485")
            break
        except Exception as e:
            retry_count += 1
            error(f"Failed to connect to RS485 (Attempt {retry_count}/{MAX_RETRIES}): {str(e)}")
            if retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            else:
                error("Failed to establish RS485 connection after maximum retries")
                rs485_connected = False
                break

    try:
        app.run(use_reloader=False, host='0.0.0.0', port=8080)
    finally:
        cleanup_modbus()

@app.route('/rs485', methods=['GET'])
def get_rs485_status():
    """Get the current status of the RS485 connection"""
    global rs485_connected
    try:
        # Just check if we have an active Modbus client
        if modbus and modbus.client and modbus.client.is_socket_open():
            return jsonify({
                "connected": True,
                "message": "RS485 connection is active"
            })
        else:
            rs485_connected = False
            return jsonify({
                "connected": False,
                "message": "RS485 connection is not active"
            })
    except Exception as e:
        rs485_connected = False
        error(f"RS485 connection check failed: {str(e)}")
        return jsonify({
            "connected": False,
            "message": f"RS485 connection error: {str(e)}"
        })

# Decorator for handling Modbus errors
def handle_modbus_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not rs485_connected:
            return jsonify({
                "status": "error",
                "message": "RS485 connection is not available"
            }), 503
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error(f"Modbus error in {f.__name__}: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Modbus error: {str(e)}"
            }), 500
    return decorated_function

# Helper function to format responses
def format_response(value, name, unit, multiplier=1):
    """Format a response with value, name, and unit"""
    if value is None:
        return jsonify({
            "status": "error",
            "message": f"Failed to read {name}"
        }), 500
    
    # Apply multiplier if provided
    if multiplier != 1:
        value = value * multiplier
    
    return jsonify({
        "status": "success",
        "name": name,
        "value": value,
        "unit": unit
    })

'''
    MODBUS CONTROL ENDPOINTS
'''
@app.route('/api/modbus/read', methods=['GET'])
@handle_modbus_errors
def read_modbus():
    """Read from Modbus register with optional range"""
    unit_id = request.args.get('unitId', type=int)
    register = request.args.get('register', type=int)
    range_val = request.args.get('range', default=1, type=int)
    
    if unit_id is None or register is None:
        return jsonify({
            "status": "error",
            "message": "Missing required parameters: unitId and register"
        }), 400
    
    # Limit range to prevent excessive reads
    if range_val > 100:
        return jsonify({
            "status": "error",
            "message": "Range cannot exceed 100 registers"
        }), 400
    
    # Read the registers
    try:
        if range_val == 1:
            value = modbus.read_register_holding(register, unit_id)
            info(f"Read register {register} from unit {unit_id}: {value}")
            return jsonify({
                "status": "success",
                "register": register,
                "unitId": unit_id,
                "value": value
            })
        else:
            value = modbus.read_register_holding(register, unit_id, range_val)
            
            info(f"Read {range_val} registers starting at {register} from unit {unit_id}")
            return jsonify({
                "status": "success",
                "unitId": unit_id,
                "startRegister": register,
                "range": range_val,
            })
    except Exception as e:
        error(f"Error reading Modbus register: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error reading register: {str(e)}"
        }), 500

@app.route('/api/modbus/write', methods=['POST'])
@handle_modbus_errors
def write_modbus():
    """Write to Modbus register"""
    data = request.get_json()
    
    if data is None:
        return jsonify({
            "status": "error",
            "message": "No JSON data received"
        }), 400
    
    unit_id = data.get('unitId')
    register = data.get('register')
    value = data.get('value')
    
    if unit_id is None or register is None or value is None:
        return jsonify({
            "status": "error",
            "message": "Missing required parameters: unitId, register, and value"
        }), 400
    
    # Write to the register
    try:
        modbus.write_register(register, value, unit_id)
        info(f"Wrote value {value} to register {register} on unit {unit_id}")
        return jsonify({
            "status": "success",
            "message": f"Successfully wrote {value} to register {register}",
            "register": register,
            "unitId": unit_id,
            "value": value
        })
    except Exception as e:
        error(f"Error writing to Modbus register: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error writing to register: {str(e)}"
        }), 500

'''
    FRONT END CONTROL ENDPOINTS (CUTTER FACE)
'''
@app.route('/api/startup-sequence', methods=['GET'])
def startup_sequence():
    modbus.write_register(0, 0b110, 1)
    time.sleep(0.1)
    modbus.write_register(0, 0b111, 1)
    modbus.write_register(0, 0b1111, 1)
    modbus.write_register(0, 0b101111, 1)
    modbus.write_register(0, 0b1101111, 1)

@app.route('/api/stop-motor', methods=['GET'])
def stop_motor():
    modbus.write_register(0, 0, 1)

#Currently not working
@app.route('/api/reverse-motor', methods=['GET'])
def reverse_motor():
    modbus.write_register(0, 0, 1)

@app.route('/api/set-frequency', methods=['POST'])
def set_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 1)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Currently Not Working
@app.route('/api/revese-frequency', methods=['POST'])
def reverse_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 1)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

'''
    FRONT END CONTROL ENDPOINTS (WATER PUMP)
'''

'''
@app.route('/api/wp/startup-sequence', methods=['GET'])
def startup_sequence():
    modbus.write_register(0, 0b110, 2)
    time.sleep(0.1)
    modbus.write_register(0, 0b111, 2)
    modbus.write_register(0, 0b1111, 2)
    modbus.write_register(0, 0b101111, 2)
    modbus.write_register(0, 0b1101111, 2)

@app.route('/api/wp/stop-motor', methods=['GET'])
def stop_motor():
    modbus.write_register(0, 0, 2)

#Currently not working
@app.route('/api/wp/reverse-motor', methods=['GET'])
def reverse_motor():
    modbus.write_register(0, 0, 2)

@app.route('/api/wp/set-frequency', methods=['POST'])
def set_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 2)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Currently Not Working
@app.route('/api/wp/revese-frequency', methods=['POST'])
def reverse_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 2)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
'''
'''
    HELPER FUNCTIONS
'''

def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({
                "error": "Modbus communication error",
                "details": str(e)
            }), 503
    return wrapper

# Helper function to format response with units
def format_response(value, name, unit="", scale_factor=1):
    return jsonify({
        name: {
            "value": value * scale_factor,
            "unit": unit
        }
    })



'''
OPERATING DATA REGISTERS (CUTTER FACE)
'''

@app.route('/api/data/speed-dir', methods=['GET'])
@handle_modbus_errors
def get_speed_dir():
    """Get motor speed and direction (-30000 to 30000 rpm)"""
    speed = modbus.read_register_holding(100, 1)
    return format_response(speed, "Speed & Direction", "rpm")

@app.route('/api/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus.read_register_holding(102, 1)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@app.route('/api/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus.read_register_holding(103, 1)
    return format_response(current, "Current", "A", 0.1)

@app.route('/api/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus.read_register_holding(104, 1)
    return format_response(torque, "Torque", "%")

@app.route('/api/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus.read_register_holding(105, 1)
    return format_response(power, "Power", "kW", 0.1)

@app.route('/api/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus.read_register_holding(106, 1)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@app.route('/api/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus.read_register_holding(108, 1)
    return format_response(output_voltage, "Output Voltage", "V")

@app.route('/api/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus.read_register_holding(109, 1)
    return format_response(drive_temp, "Drive Temperature", "°C")

@app.route('/api/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus.read_register_holding(149, 1)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@app.route('/api/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus.read_register_holding(152, 1)
    return format_response(mot_therm_stress, "Motor Thermal Stress", "%")

'''
FAULT HISTORY REGISTERS (CUTTER FACE)
'''

@app.route('/api/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus.read_register_holding(401, 1)
    return format_response(latest_fault, "Latest Fault", "code")

@app.route('/api/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus.read_register_holding(404, 1)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@app.route('/api/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus.read_register_holding(405, 1)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@app.route('/api/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus.read_register_holding(406, 1)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@app.route('/api/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus.read_register_holding(407, 1)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@app.route('/api/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus.read_register_holding(408, 1)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@app.route('/api/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus.read_register_holding(409, 1)
    return format_response(status_at_fault, "Status at Fault", "code")


@app.route('/api/data/operating', methods=['GET'])
def get_operating_data():
    try:
        rows = db.get_recent_operating_data()
        return jsonify([row.to_dict() for row in rows])
    except Exception as e:
        error(f"Error fetching operating data: {str(e)}")
        return jsonify({'error': str(e)}), 500
    


'''
OPERATING DATA REGISTERS (WATER PUMP)


@app.route('/api/wp/data/speed-dir', methods=['GET'])
@handle_modbus_errors
def get_speed_dir():
    """Get motor speed and direction (-30000 to 30000 rpm)"""
    speed = modbus.read_register(100, 1)
    return format_response(speed, "Speed & Direction", "rpm")

@app.route('/api/wp/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus.read_register(102, 1)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@app.route('/api/wp/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus.read_register(103, 1)
    return format_response(current, "Current", "A", 0.1)

@app.route('/api/wp/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus.read_register(104, 1)
    return format_response(torque, "Torque", "%")

@app.route('/api/wp/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus.read_register(105, 1)
    return format_response(power, "Power", "kW", 0.1)

@app.route('/api/wp/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus.read_register(106, 1)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@app.route('/api/wp/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus.read_register(108, 1)
    return format_response(output_voltage, "Output Voltage", "V")

@app.route('/api/wp/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus.read_register(109, 1)
    return format_response(drive_temp, "Drive Temperature", "°C")

@app.route('/api/wp/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus.read_register(149, 1)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@app.route('/api/wp/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus.read_register(152, 1)
    return format_response(mot_therm_stress, "Motor Thermal Stress", "%")
'''
'''
FAULT HISTORY REGISTERS (WATER PUMP)


@app.route('/api/wp/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus.read_register(401, 1)
    return format_response(latest_fault, "Latest Fault", "code")

@app.route('/api/wp/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus.read_register(404, 1)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@app.route('/api/wp/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus.read_register(405, 1)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@app.route('/api/wp/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus.read_register(406, 1)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@app.route('/api/wp/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus.read_register(407, 1)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@app.route('/api/wp/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus.read_register(408, 1)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@app.route('/api/wp/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus.read_register(409, 1)
    return format_response(status_at_fault, "Status at Fault", "code")


@app.route('/api/wp/data/operating', methods=['GET'])
def get_operating_data():
    try:
        rows = db.get_recent_operating_data_water_pump()
        return jsonify([row.to_dict() for row in rows])
    except Exception as e:
        error(f"Error fetching operating data for waterpump: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
'''
'''
HEALTH CHECK ENDPOINTS
'''
@app.route('/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    try:
        modbus.read_register_holding(1, 3)
        return jsonify({
            "status": "healthy",
            "message": "API is running and Modbus connection is active"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": f"Modbus connection error: {str(e)}"
        }), 503
    
'''
Power Management Board Endpoints
'''

@app.route('/api/pm/set-120V', methods=['POST'])
def set_120V():
    try:
        data = request.get_json()
        value = data.get('value', 0)  # Get the value from request, default to 0
        modbus.write_register(6, value, 7)
        return jsonify({
            "status": "success",
            "message": f"120V set to {value} successfully"
        })
    except Exception as e:
        error(f"Error setting 120V: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
@app.route('/api/pm/set-480V', methods=['POST'])
def set_480():
    try:
        data = request.get_json()
        value = data.get('value', 0)
        modbus.write_register(6, data, 7)
        return jsonify({
            "status": "success",
            "message": "480V set successfully"
        })
    except Exception as e:
        error(f"Error setting 480V: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
'''
Below Ground Board Endpoints
'''
@app.route('/api/bg/get-thrustTop', methods=['GET'])
def get_thrustTop():
    value = modbus.read_register_holding(9, 5)
    return value

@app.route('/api/bg/get-thrustLeft', methods=['GET'])
def get_thrustLeft():
    value = modbus.read_register_holding(10, 5)
    return jsonify(value)

@app.route('/api/bg/get-thrustRight', methods=['GET'])
def get_thrustRight():
    value = modbus.read_register_holding(11, 5)
    return jsonify(value)

@app.route('/api/bg/motor-temp', methods=['GET'])
def get_motor_temp():
    value = modbus.read_register_holding(12, 5)
    return jsonify(value)

@app.route('/api/bg/earth-preassure', methods=['GET'])
def get_earth_pressure():
    value = modbus.read_register_holding(13, 5)
    return jsonify(value)

@app.route('/api/bg/flame', methods=['GET'])
def get_flame():
    value = modbus.read_register_holding(14, 5)
    return jsonify(value)

@app.route('/api/bg/actuator-A', methods=['GET'])
def get_actuator_a():
    value = modbus.read_register_holding(15, 5)
    return jsonify(value)

@app.route('/api/bg/actuator-B', methods=['GET'])
def get_actuator_b():
    value = modbus.read_register_holding(16, 5)
    return jsonify(value)

@app.route('/api/bg/actuator-C', methods=['GET'])
def get_actuator_c():
    value = modbus.read_register_holding(17, 5)
    return jsonify(value)

@app.route('/api/bg/encoder-speed', methods=['GET'])
def get_encoder_speed():
    value = modbus.read_register_holding(62, 5)
    return value

'''
Above Ground Board Endpoints
'''
@app.route('/api/ag/oil-preassure', methods=['GET'])
def get_oil_pressure():
    value = modbus.read_register_holding(12, 6)
    return jsonify(value)

@app.route('/api/ag/oil-temp', methods=['GET'])
def get_oil_temp():
    value = modbus.read_register_holding(10, 6)
    return jsonify(value)

'''
480 Power Meter Endpoints
'''
@app.route('/api/pm480/V1N', methods=['GET'])
@handle_modbus_errors
def get_480_V1N():
    x = (modbus.read_register_input(8, 3) & 0xFFFF)  
    y = (modbus.read_register_input(9, 3) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm480/V2N', methods=['GET'])
@handle_modbus_errors
def get_480_V2N():
    x = (modbus.read_register_input(10, 3) & 0xFFFF)  
    y = (modbus.read_register_input(11, 3) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm480/V3N', methods=['GET'])
@handle_modbus_errors
def get_480_V3N():
    x = (modbus.read_register_input(12, 3) & 0xFFFF)  
    y = (modbus.read_register_input(13, 3) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm480/I1', methods=['GET'])
@handle_modbus_errors
def get_480_I1():
    x = (modbus.read_register_input(16, 3) & 0xFFFF)  
    y = (modbus.read_register_input(17, 3) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm480/I2', methods=['GET'])
@handle_modbus_errors
def get_480_I2():
    x = (modbus.read_register_input(18, 3) & 0xFFFF)  
    y = (modbus.read_register_input(19, 3) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

'''
120 Power Meter Endpoints
'''

@app.route('/api/pm120/V1N', methods=['GET'])
@handle_modbus_errors
def get_120_V1N():
    x = (modbus.read_register_input(0, 4) & 0xFFFF)  
    y = (modbus.read_register_input(1, 4) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm120/V2N', methods=['GET'])
@handle_modbus_errors
def get_120_V2N():
    x = (modbus.read_register_input(2, 4) & 0xFFFF)  
    y = (modbus.read_register_input(3, 4) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm120/V3N', methods=['GET'])
@handle_modbus_errors
def get_120_V3N():
    x = (modbus.read_register_input(4, 4) & 0xFFFF)  
    y = (modbus.read_register_input(5, 4) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm120/I1', methods=['GET'])
@handle_modbus_errors
def get_120_I1():
    x = (modbus.read_register_input(16, 4) & 0xFFFF)  
    y = (modbus.read_register_input(17, 4) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)

@app.route('/api/pm120/I2', methods=['GET'])
@handle_modbus_errors
def get_120_I2():
    x = (modbus.read_register_input(18, 4) & 0xFFFF)  
    y = (modbus.read_register_input(19, 4) & 0xFFFF) << 16

    z = x + y

    float_value = struct.unpack('<f', struct.pack('<I', z))[0]
    return jsonify(float_value)


if __name__ == '__main__':
    run_server()
