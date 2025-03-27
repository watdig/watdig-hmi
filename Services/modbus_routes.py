import sys
import os
import struct  # Add this import for struct operations

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

modbus_bp = Blueprint('modbus', __name__)
modbus_client = ModbusConnection()

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
        data = request.json
        unit_id = data.get('unitId')
        register = data.get('register')
        value = data.get('value')

        if not all([isinstance(x, int) for x in [unit_id, register, value]]):
            return jsonify({'message': 'Invalid parameters'}), 400

        if not modbus_client.client or not modbus_client.client.is_socket_open():
            return jsonify({'message': 'No Modbus connection available'}), 503

        modbus_client.write_register(register, value, unit_id)
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
        # Try to read a register to verify connection
        try:
            # Use any simple read operation to test connection
            modbus_client.read_register_holding(0, 1)
            return jsonify({
                "connected": True,
                "message": "RS485 connection is active"
            })
        except Exception as e:
            error(f"RS485 communication test failed: {str(e)}")
            return jsonify({
                "connected": False,
                "message": f"RS485 communication test failed: {str(e)}"
            })
    except Exception as e:
        error(f"RS485 connection check failed: {str(e)}")
        return jsonify({
            "connected": False,
            "message": f"RS485 connection error: {str(e)}"
        })

'''
Power Meter Endpoints
'''
@modbus_bp.route('/pm480/V1N', methods=['GET'])
def get_480_V1N():
    try:
        x = (modbus_client.read_register_input(8, 3) & 0xFFFF)  
        y = (modbus_client.read_register_input(9, 3) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 480V V1N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm480/V2N', methods=['GET'])
def get_480_V2N():
    try:
        x = (modbus_client.read_register_input(10, 3) & 0xFFFF)  
        y = (modbus_client.read_register_input(11, 3) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 480V V2N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm480/V3N', methods=['GET'])
def get_480_V3N():
    try:
        x = (modbus_client.read_register_input(12, 3) & 0xFFFF)  
        y = (modbus_client.read_register_input(13, 3) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 480V V3N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm480/I1', methods=['GET'])
def get_480_I1():
    try:
        x = (modbus_client.read_register_input(16, 3) & 0xFFFF)  
        y = (modbus_client.read_register_input(17, 3) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 480V I1: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm480/I2', methods=['GET'])
def get_480_I2():
    try:
        x = (modbus_client.read_register_input(18, 3) & 0xFFFF)  
        y = (modbus_client.read_register_input(19, 3) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 480V I2: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

# 120V Power Meter endpoints
@modbus_bp.route('/pm120/V1N', methods=['GET'])
def get_120_V1N():
    try:
        x = (modbus_client.read_register_input(0, 4) & 0xFFFF)  
        y = (modbus_client.read_register_input(1, 4) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 120V V1N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm120/V2N', methods=['GET'])
def get_120_V2N():
    try:
        x = (modbus_client.read_register_input(2, 4) & 0xFFFF)  
        y = (modbus_client.read_register_input(3, 4) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 120V V2N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm120/V3N', methods=['GET'])
def get_120_V3N():
    try:
        x = (modbus_client.read_register_input(4, 4) & 0xFFFF)  
        y = (modbus_client.read_register_input(5, 4) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 120V V3N: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm120/I1', methods=['GET'])
def get_120_I1():
    try:
        x = (modbus_client.read_register_input(16, 4) & 0xFFFF)  
        y = (modbus_client.read_register_input(17, 4) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 120V I1: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@modbus_bp.route('/pm120/I2', methods=['GET'])
def get_120_I2():
    try:
        x = (modbus_client.read_register_input(18, 4) & 0xFFFF)  
        y = (modbus_client.read_register_input(19, 4) & 0xFFFF) << 16
        z = x + y
        float_value = struct.unpack('<f', struct.pack('<I', z))[0]
        return jsonify(float_value)
    except Exception as e:
        error(f"Error reading 120V I2: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

   
'''
CutterHead VFD Endpoints
'''

@modbus_bp.route('/api/startup-sequence', methods=['GET'])
def startup_sequence():
    modbus_client.write_register(0, 0b110, 1)
    time.sleep(0.1)
    modbus_client.write_register(0, 0b111, 1)
    modbus_client.write_register(0, 0b1111, 1)
    modbus_client.write_register(0, 0b101111, 1)
    modbus_client.write_register(0, 0b1101111, 1)



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