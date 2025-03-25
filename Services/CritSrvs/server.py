from flask import Flask, jsonify, request
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from Services.database_service import Database as db
import sqlite3
from flask_cors import CORS
import threading
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
from Models.ModbusDB.operating_data_table import OperatingData

def create_app():
    app = Flask(__name__)
    CORS(app)
    return app

def run_server():
    app = create_app()
    app.run(use_reloader=False, host='0.0.0.0', port=8080)

# Start instance of Modbus Connection and Flask App
modbus = ModbusConnection()
app = create_app()

# Decorator for handling Modbus errors
def handle_modbus_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
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
            value = modbus.read_register(register, unit_id)
            info(f"Read register {register} from unit {unit_id}: {value}")
            return jsonify({
                "status": "success",
                "register": register,
                "unitId": unit_id,
                "value": value
            })
        else:
            value = modbus.read_register(register, unit_id, range_val)
            
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
    speed = modbus.read_register(100, 1)
    return format_response(speed, "Speed & Direction", "rpm")

@app.route('/api/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus.read_register(102, 1)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@app.route('/api/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus.read_register(103, 1)
    return format_response(current, "Current", "A", 0.1)

@app.route('/api/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus.read_register(104, 1)
    return format_response(torque, "Torque", "%")

@app.route('/api/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus.read_register(105, 1)
    return format_response(power, "Power", "kW", 0.1)

@app.route('/api/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus.read_register(106, 1)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@app.route('/api/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus.read_register(108, 1)
    return format_response(output_voltage, "Output Voltage", "V")

@app.route('/api/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus.read_register(109, 1)
    return format_response(drive_temp, "Drive Temperature", "°C")

@app.route('/api/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus.read_register(149, 1)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@app.route('/api/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus.read_register(152, 1)
    return format_response(mot_therm_stress, "Motor Thermal Stress", "%")

'''
FAULT HISTORY REGISTERS (CUTTER FACE)
'''

@app.route('/api/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus.read_register(401, 1)
    return format_response(latest_fault, "Latest Fault", "code")

@app.route('/api/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus.read_register(404, 1)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@app.route('/api/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus.read_register(405, 1)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@app.route('/api/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus.read_register(406, 1)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@app.route('/api/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus.read_register(407, 1)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@app.route('/api/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus.read_register(408, 1)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@app.route('/api/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus.read_register(409, 1)
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
        modbus.read_register(1, 3)
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
    thrustTop = modbus.read_register(9, 5)
    return thrustTop

@app.route('/api/bg/get-thrustLeft', methods=['GET'])
def get_thrustLeft():
    thrustLeft = modbus.read_register(10, 5)
    return thrustLeft

@app.route('/api/bg/get-thrustRight', methods=['GET'])
def get_thrustRight():
    thrustRight = modbus.read_register(11, 5)
    return thrustRight

@app.route('/api/bg/motor-temp', methods=['GET'])
def get_bg_motor_temp():
    motorTemp = modbus.read_register(12, 5)
    return motorTemp

@app.route('/api/bg/earth-preassure', methods=['GET'])
def get_earth_preassure():
    earthPreassure = modbus.read_register(13, 5)
    return earthPreassure

@app.route('/api/bg/flame', methods=['GET'])
def get_flame():
    flame = modbus.read_register(14, 5)
    return flame

@app.route('/api/bg/actuator-A', methods=['GET'])
def get_actuator_A():
    actuatorA = modbus.read_register(15, 5)
    return actuatorA

@app.route('/api/bg/actuator-B', methods=['GET'])
def get_actuator_B():
    actuatorB = modbus.read_register(16, 5)
    return actuatorB

@app.route('/api/bg/actuator-C', methods=['GET'])
def get_actuator_C():
    actuatorC = modbus.read_register(17, 5)
    return actuatorC


if __name__ == '__main__':
    run_server()
