import sys
import os
import struct  # Add this import for struct operations
from functools import wraps

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Blueprint, Flask, jsonify, request
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
import traceback
from Test.pid_controller import WaterPumpSimulation
import time
from threading import Thread
from flask_cors import CORS
from Services.database_service import Database as db

modbus_bp = Blueprint('modbus', __name__)
modbus_client = ModbusConnection()
modbus_client.initialize()

# Create a global instance of the simulation
water_pump_sim = WaterPumpSimulation()
pid_control_active = False
target_pressure = 0

# Define register addresses
WATER_PUMP_STATE_REGISTER = 1  # Example register for water pump state
VFD_FREQUENCY_REGISTER = 2     # Example register for VFD frequency

@modbus_bp.route('/read', methods=['GET'])
def read_register():
    try:
        unit_id = request.args.get('unitId', type=int)
        register = request.args.get('register', type=int)
        range_size = request.args.get('range', 1, type=int)

        if not all([isinstance(x, int) for x in [unit_id, register]]):
            return jsonify({'message': 'Invalid parameters'}), 400

        if not modbus_client.client or not modbus_client.client.is_socket_open():
            return jsonify({'message': 'No Modbus connection available'}), 503

        if range_size > 1:
            # Read multiple registers
            result = []
            for i in range(range_size):
                value = modbus_client.read_register_holding(register + i, unit_id)
                result.append({
                    'register': register + i,
                    'value': value
                })
            return jsonify(result)
        else:
            # Read single register
            value = modbus_client.read_register_holding(register, unit_id)
            return jsonify({
                'register': register,
                'value': value
            })

    except Exception as e:
        error(f"Error reading Modbus register: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/write', methods=['POST'])
def write_register():
    try:
        unit_id = request.args.get('unitId', type=int)
        register = request.args.get('register', type=int)
        value = request.args.get('value', type=int)

        if not all([isinstance(x, int) for x in [unit_id, register, value]]):
            return jsonify({'message': 'Invalid parameters'}), 400

        if not modbus_client.client or not modbus_client.client.is_socket_open():
            return jsonify({'message': 'No Modbus connection available'}), 503

        modbus_client.write_register(register, [value], unit_id)
        return jsonify({
            'message': 'Write successful',
            'register': register,
            'value': value
        })

    except Exception as e:
        error(f"Error writing to Modbus register: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/api/modbus/water_pump_pid', methods=['POST'])
def water_pump_pid():
    global pid_control_active, target_pressure
    try:
        data = request.get_json()
        # Convert target pressure from PSI to bar for internal processing
        target_pressure_psi = data.get('target_pressure', 0)
        target_pressure = target_pressure_psi / 14.5038  # Convert PSI to bar
        
        # Turn on the water pump first
        modbus_client.write_register(WATER_PUMP_STATE_REGISTER, 1)  # 1 for ON
        pid_control_active = True
        
        # Start PID control loop in a background thread
        def pid_loop():
            while pid_control_active:
                try:
                    result = water_pump_sim.update(target_pressure, dt=0.1)
                    # Update the VFD frequency through modbus
                    modbus_client.write_register(
                        VFD_FREQUENCY_REGISTER, 
                        int(result['frequency'] * 100)
                    )
                    time.sleep(0.1)
                except Exception as e:
                    error(f"Error in PID loop: {str(e)}")
                    break
    
        thread = Thread(target=pid_loop)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': 'PID control started'
        })
        
    except Exception as e:
        error(f"Error starting PID control: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@modbus_bp.route('/api/modbus/water_pump_pressure', methods=['GET'])
def get_water_pump_pressure():
    try:
        if not pid_control_active:
            return jsonify({'pressure': 0})
            
        pressure = water_pump_sim.current_pressure
        return jsonify({
            'pressure': pressure,
            'frequency': water_pump_sim.current_frequency
        })
    except Exception as e:
        error(f"Error getting pump pressure: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@modbus_bp.route('/api/modbus/water_pump', methods=['POST'])
def control_water_pump():
    global pid_control_active
    try:
        data = request.get_json()
        state = data.get('state', False)
        
        if not state:
            pid_control_active = False
            water_pump_sim.current_pressure = 0
            water_pump_sim.current_frequency = 0
            
        modbus_client.write_register(WATER_PUMP_STATE_REGISTER, 1 if state else 0)
        return jsonify({'status': 'success'})
        
    except Exception as e:
        error(f"Error controlling water pump: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

'''
    RS485 Endpoint
'''

@modbus_bp.route('/rs485', methods=['GET'])
def get_rs485_status():
    """Get the current status of the RS485 connection"""
    try:
        # Try to read a register to check connection
        result = modbus_client.read_register_holding(0, 3)
        
        # Check if result is None or an error
        if result is None:
            return jsonify({
                "connected": False,
                "message": "RS485 connection failed: No response"
            })
        
        # Check if result is an error object (has isError method and returns True)
        if hasattr(result, 'isError') and result.isError():
            return jsonify({
                "connected": False,
                "message": f"RS485 connection error: {result}"
            })
        
        # If we get here, connection is good
        return jsonify({
            "connected": True,
            "message": "RS485 connection is active"
        })
    except Exception as e:
        # Any exception means the connection failed
        error(f"RS485 connection check failed: {str(e)}")
        return jsonify({
            "connected": False,
            "message": f"RS485 connection error: {str(e)}"
        })

'''
Power Meter Endpoints
'''
'''@modbus_bp.route('/api/pm480/V1N', methods=['GET'])
def get_480_V1N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(8, 2, 3)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 480V V1N: {str(e)}"
        error(error_msg)  # Log the error
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm480/V2N', methods=['GET'])
def get_480_V2N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(10, 2, 3)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 480V V2N: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm480/V3N', methods=['GET'])
def get_480_V3N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(12, 2, 3)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 480V V3N: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm480/I1', methods=['GET'])
def get_480_I1():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(16, 2, 3)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 480V I1: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm480/I2', methods=['GET'])
def get_480_I2():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(18, 2, 3)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 480V I2: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

# 120V Power Meter endpoints
@modbus_bp.route('/api/pm120/V1N', methods=['GET'])
def get_120_V1N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(0, 2, 4)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 120V V1N: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm120/V2N', methods=['GET'])
def get_120_V2N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(2, 2, 4)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 120V V2N: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm120/V3N', methods=['GET'])
def get_120_V3N():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(4, 2, 4)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 120V V3N: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm120/I1', methods=['GET'])
def get_120_I1():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(16, 2, 4)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 120V I1: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200

@modbus_bp.route('/api/pm120/I2', methods=['GET'])
def get_120_I2():
    try:
        # Read both registers in a single operation
        result = modbus_client.read_register_input(18, 2, 4)
        x = result.registers[0] & 0xFFFF
        y = (result.registers[1] & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error_msg = f"Error reading 120V I2: {str(e)}"
        error(error_msg)
        return jsonify({"error": error_msg, "value": 0}), 200'''

'''
IMU data
'''

   
'''
#CutterHead VFD Endpoints
'''

@modbus_bp.route('/api/startup-sequence', methods=['GET'])
def startup_sequence():
    modbus_client.write_register(0, 0b110, 2)
    time.sleep(0.1)
    modbus_client.write_register(0, 0b111, 2)
    modbus_client.write_register(0, 0b1111, 2)
    modbus_client.write_register(0, 0b101111, 2)
    modbus_client.write_register(0, 0b1101111, 2)
    modbus_client.write_register(0, [6], 2)
    time.sleep(0.1)
    modbus_client.write_register(0, [7], 2)
    modbus_client.write_register(0, [15], 2)
    modbus_client.write_register(0, [47], 2)
    modbus_client.write_register(0, [111], 2)

@modbus_bp.route('/api/stop-motor', methods=['GET'])
def stop_motor():
    modbus_client.write_register(0, [0], 2)

@modbus_bp.route('/api/set-frequency', methods=['POST'])
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
                modbus_client.write_register(1, [frequency], 2)
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
@modbus_bp.route('/api/revese-frequency', methods=['POST'])
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
                modbus_client.write_register(1, [frequency], 2)
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
#Water Pump VFD Endpoints
'''
@modbus_bp.route('/api/wp/startup-sequence', methods=['GET'])
def startup_sequence_wp():
    modbus_client.write_register(0, 0b110, 1)
    time.sleep(0.1)
    modbus_client.write_register(0, 0b111, 1)
    modbus_client.write_register(0, 0b1111, 1)
    modbus_client.write_register(0, 0b101111, 1)
    modbus_client.write_register(0, 0b1101111, 1)
    modbus_client.write_register(0, [6], 1)
    time.sleep(0.1)
    modbus_client.write_register(0, [7], 1)
    modbus_client.write_register(0, [15], 1)
    modbus_client.write_register(0, [47], 1)
    modbus_client.write_register(0, [111], 1)

@modbus_bp.route('/api/wp/stop-motor', methods=['GET'])
def stop_motor_wp():
    modbus_client.write_register(0, 0, 1)

#Currently not working
@modbus_bp.route('/api/wp/reverse-motor', methods=['GET'])
def reverse_motor_wp():
    modbus_client.write_register(0, 0, 1)

@modbus_bp.route('/api/wp/set-frequency', methods=['POST'])
def set_frequency_wp():
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
                modbus_client.write_register(1, [frequency], 1)
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
@modbus_bp.route('/api/wp/revese-frequency', methods=['POST'])
def reverse_frequency_wp():
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
                modbus_client.write_register(1, [frequency], 2)
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
#    HELPER FUNCTIONS
'''

def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            # Apply a timeout to the function execution
            return f(*args, **kwargs)
        except Exception as e:
            # Log the error but don't allow it to block the server
            error(f"Error in {f.__name__}: {str(e)}")
            # Return a simple error response
            return jsonify({
                "error": "Modbus communication error",
                "details": str(e),
                "status": "error"
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

@modbus_bp.route('/api/data/speed-dir', methods=['GET'])
@handle_modbus_errors
def get_speed_dir():
    """Get motor speed and direction (-30000 to 30000 rpm)"""
    speed = modbus_client.read_register_holding(100, 1)
    return format_response(speed, "Speed & Direction", "rpm")

@modbus_bp.route('/api/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus_client.read_register_holding(102, 1)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@modbus_bp.route('/api/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus_client.read_register_holding(103, 1)
    return format_response(current, "Current", "A", 0.1)

@modbus_bp.route('/api/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus_client.read_register_holding(104, 1)
    return format_response(torque, "Torque", "%")

@modbus_bp.route('/api/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus_client.read_register_holding(105, 1)
    return format_response(power, "Power", "kW", 0.1)

@modbus_bp.route('/api/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus_client.read_register_holding(106, 1)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@modbus_bp.route('/api/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus_client.read_register_holding(108, 1)
    return format_response(output_voltage, "Output Voltage", "V")

@modbus_bp.route('/api/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus_client.read_register_holding(109, 1)
    return format_response(drive_temp, "Drive Temperature", "°C")

@modbus_bp.route('/api/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus_client.read_register_holding(149, 1)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@modbus_bp.route('/api/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus_client.read_register_holding(152, 2)
    return jsonify(mot_therm_stress)

'''
#FAULT HISTORY REGISTERS (CUTTER FACE)
'''

@modbus_bp.route('/api/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus_client.read_register_holding(401, 1)
    return format_response(latest_fault, "Latest Fault", "code")

@modbus_bp.route('/api/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus_client.read_register_holding(404, 1)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@modbus_bp.route('/api/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus_client.read_register_holding(405, 1)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@modbus_bp.route('/api/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus_client.read_register_holding(406, 1)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@modbus_bp.route('/api/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus_client.read_register_holding(407, 1)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@modbus_bp.route('/api/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus_client.read_register_holding(408, 1)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@modbus_bp.route('/api/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus_client.read_register_holding(409, 1)
    return format_response(status_at_fault, "Status at Fault", "code")


@modbus_bp.route('/api/data/operating', methods=['GET'])
def get_operating_data():
    try:
        rows = db.get_recent_operating_data()
        return jsonify([row.to_dict() for row in rows])
    except Exception as e:
        error(f"Error fetching operating data: {str(e)}")
        return jsonify({'error': str(e)}), 500

'''
Do waterpump later
'''

'''
Below Ground Board Endpoints
'''
'''
@modbus_bp.route('/api/bg/get-thrustTop', methods=['GET'])
def get_thrustTop():
    response = modbus_client.read_register_holding(9, 5)
    # Handle the response object correctly
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return 1000  # Return None if no valid data

@modbus_bp.route('/api/bg/get-thrustLeft', methods=['GET'])
def get_thrustLeft():
    response = modbus_client.read_register_holding(10, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return 1000

@modbus_bp.route('/api/bg/get-thrustRight', methods=['GET'])
def get_thrustRight():
    response = modbus_client.read_register_holding(11, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return 1000
'''
@modbus_bp.route('/api/bg/motor-temp', methods=['GET'])
def get_motor_temp():
    response = modbus_client.read_register_holding(12, 5)
    print(response.registers[0])
    if hasattr(response, 'registers') and len(response.registers) > 0:
        adc_value = response.registers[0]

        # Known calibration points
        adc1, temp1 = 650, 22.0
        adc2, temp2 = 4000, 50.0

        # Linear equation: Temp = m * adc + b
        m = (temp2 - temp1) / (adc2 - adc1)
        b = temp1 - m * adc1

        temperature = m * adc_value + b

        return jsonify(round(temperature, 1))
    
    return jsonify(None)


@modbus_bp.route('/api/bg/earth-preassure', methods=['GET'])
def get_earth_pressure():
    response = modbus_client.read_register_holding(13, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)

@modbus_bp.route('/api/bg/flame', methods=['GET'])
def get_flame():
    response = modbus_client.read_register_holding(14, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)

'''@modbus_bp.route('/api/bg/actuator-A', methods=['GET'])
def get_actuator_a():
    response = modbus_client.read_register_holding(15, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)

@modbus_bp.route('/api/bg/actuator-B', methods=['GET'])
def get_actuator_b():
    response = modbus_client.read_register_holding(16, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)

@modbus_bp.route('/api/bg/actuator-C', methods=['GET'])
def get_actuator_c():
    response = modbus_client.read_register_holding(17, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)'''

@modbus_bp.route('/api/bg/encoder-speed', methods=['GET'])
def get_encoder_speed():
    response = modbus_client.read_register_holding(62, 5)
    if hasattr(response, 'registers') and len(response.registers) > 0:
        return jsonify(response.registers[0])
    return jsonify(None)

'''
Above Ground Board Endpoints
'''

'''@modbus_bp.route('/api/ag/oil-preassure', methods=['GET'])
def get_oil_pressure():
    value = modbus_client.read_register_holding(12, 6)
    return jsonify(value.registers[0])

@modbus_bp.route('/api/ag/oil-temp', methods=['GET'])
def get_oil_temp():
    value = modbus_client.read_register_holding(10, 6)
    return jsonify(value.registers[0])'''

@modbus_bp.route('/api/ag/water-preassure', methods=['GET'])
def get_water_pressure():
    try:
        value = modbus_client.read_register_holding(11, 6)
        # Check if value is a successful response with registers
        if hasattr(value, 'registers'):
            return jsonify(value.registers[0])
        else:
            # This is an error response, handle it gracefully
            return jsonify({"error": "Failed to read water pressure", "value": None}), 200
    except Exception as e:
        # Log the exception but return a valid response
        print(f"Error reading water pressure: {str(e)}")
        return jsonify({"error": str(e), "value": None}), 200

'''
Turn On Powers
'''
'''@modbus_bp.route('/api/120VON', methods=['GET'])
def turn_on_120VON():
    try:
        modbus_client.write_register(6, [1], 7)
        time.sleep(0.2)
        modbus_client.write_register(6, [3], 7)
        return jsonify({"status": "success", "message": "120V signal sent"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500'''

'''@modbus_bp.route('/api/pmb/read_id', methods=['GET'])
def get_pm_board_id():
    value = modbus_client.read_register_holding(0, 7)
    return jsonify(value.registers[0])'''
# Create a standalone app when this file is run directly
def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Register the blueprint with no prefix when running standalone
    app.register_blueprint(modbus_bp)
    
    # Add a root route for testing
    @app.route('/')
    def index():
        return jsonify({
            "status": "running",
            "message": "Modbus API server is running",
            "endpoints": [
                "/read", 
                "/write",
                "/pm480/V1N",
                "/pm480/V2N",
                "/pm480/V3N",
                "/pm480/I1",
                "/pm480/I2",
                "/pm120/V1N",
                "/pm120/V2N",
                "/pm120/V3N",
                "/pm120/I1",
                "/pm120/I2",
                "/api/startup-sequence"
            ]
        })
    
    return app

# Run the app when this file is executed directly
if __name__ == '__main__':
    app = create_app()
    info("Starting Modbus API server on http://127.0.0.1:5000")
    try:
        # Run with threaded=True to handle multiple requests
        app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
    except KeyboardInterrupt:
        info("Server stopped by user")
    except Exception as e:
        error(f"Server error: {str(e)}")
    finally:
        # Clean up resources
        if hasattr(modbus_client, 'client') and modbus_client.client:
            try:
                modbus_client.client.close()
                info("Modbus connection closed")
            except Exception as e:
                error(f"Error closing Modbus connection: {str(e)}") 