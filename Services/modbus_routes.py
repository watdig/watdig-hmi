from flask import Blueprint, jsonify, request
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
import traceback

modbus_bp = Blueprint('modbus', __name__)
modbus_client = ModbusConnection()

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