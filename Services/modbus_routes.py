from flask import Blueprint, jsonify, request
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
import traceback
from Test.pid_controller import WaterPumpSimulation
import time
from threading import Thread

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
                value = modbus_client.read_register(register + i, unit_id)
                result.append({
                    'register': register + i,
                    'value': value
                })
            return jsonify(result)
        else:
            # Read single register
            value = modbus_client.read_register(register, unit_id)
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