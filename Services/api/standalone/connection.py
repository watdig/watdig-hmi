"""Connection routes; runtime supplies shared device state and services."""

from flask import jsonify, request
import traceback


def register_routes(router, runtime):
    @router.route("/read", methods=["GET"])
    def read_register():
        try:
            unit_id = request.args.get("unitId", type=int)
            register = request.args.get("register", type=int)
            range_size = request.args.get("range", 1, type=int)

            if not all([isinstance(x, int) for x in [unit_id, register]]):
                return jsonify({"message": "Invalid parameters"}), 400

            if (
                not runtime.modbus_client.client
                or not runtime.modbus_client.client.is_socket_open()
            ):
                return jsonify({"message": "No Modbus connection available"}), 503

            if range_size > 1:
                # Read multiple registers
                result = []
                for i in range(range_size):
                    value = runtime.modbus_client.read_register_holding(
                        register + i, unit_id
                    )
                    result.append({"register": register + i, "value": value})
                return jsonify(result)
            else:
                # Read single register
                value = runtime.modbus_client.read_register_holding(register, unit_id)
                return jsonify({"register": register, "value": value})

        except Exception as e:
            runtime.error(
                f"Error reading Modbus register: {str(e)}\n{traceback.format_exc()}"
            )
            return jsonify({"message": str(e)}), 500

    @router.route("/write", methods=["POST"])
    def write_register():
        try:
            unit_id = request.args.get("unitId", type=int)
            register = request.args.get("register", type=int)
            value = request.args.get("value", type=int)

            if not all([isinstance(x, int) for x in [unit_id, register, value]]):
                return jsonify({"message": "Invalid parameters"}), 400

            if (
                not runtime.modbus_client.client
                or not runtime.modbus_client.client.is_socket_open()
            ):
                return jsonify({"message": "No Modbus connection available"}), 503

            runtime.modbus_client.write_register(register, [value], unit_id)
            return jsonify(
                {"message": "Write successful", "register": register, "value": value}
            )

        except Exception as e:
            runtime.error(
                f"Error writing to Modbus register: {str(e)}\n{traceback.format_exc()}"
            )
            return jsonify({"message": str(e)}), 500

    @router.route("/rs485", methods=["GET"])
    def get_rs485_status():
        """Get the current status of the RS485 connection"""
        try:
            # Try to read a register to check connection
            result = runtime.modbus_client.read_register_holding(0, 3)

            # Check if result is None or an error
            if result is None:
                return jsonify(
                    {
                        "connected": False,
                        "message": "RS485 connection failed: No response",
                    }
                )

            # Check if result is an error object (has isError method and returns True)
            if hasattr(result, "isError") and result.isError():
                return jsonify(
                    {"connected": False, "message": f"RS485 connection error: {result}"}
                )

            # If we get here, connection is good
            return jsonify({"connected": True, "message": "RS485 connection is active"})
        except Exception as e:
            # Any exception means the connection failed
            runtime.error(f"RS485 connection check failed: {str(e)}")
            return jsonify(
                {"connected": False, "message": f"RS485 connection error: {str(e)}"}
            )

    return {
        "read_register": read_register,
        "write_register": write_register,
        "get_rs485_status": get_rs485_status,
    }
