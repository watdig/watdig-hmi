"""Connection routes; runtime supplies shared device state and services."""

from flask import jsonify, request

from Services.modbus_values import register_value, register_values


def register_routes(router, runtime):
    @router.route("/rs485", methods=["GET"])
    def get_rs485_status():
        """Get the current status of the RS485 connection"""
        try:
            # Just check if we have an active Modbus client
            if (
                runtime.modbus
                and runtime.modbus.client
                and runtime.modbus.client.is_socket_open()
            ):
                return jsonify(
                    {"connected": True, "message": "RS485 connection is active"}
                )
            else:
                runtime.rs485_connected = False
                return jsonify(
                    {"connected": False, "message": "RS485 connection is not active"}
                )
        except Exception as e:
            runtime.rs485_connected = False
            runtime.error(f"RS485 connection check failed: {str(e)}")
            return jsonify(
                {"connected": False, "message": f"RS485 connection error: {str(e)}"}
            )

    @router.route("/api/modbus/read", methods=["GET"])
    @runtime.handle_connection_errors
    def read_modbus():
        """Read from Modbus register with optional range"""
        unit_id = request.args.get("unitId", type=int)
        register = request.args.get("register", type=int)
        range_val = request.args.get("range", default=1, type=int)

        if unit_id is None or register is None:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Missing required parameters: unitId and register",
                    }
                ),
                400,
            )

        # Limit range to prevent excessive reads
        if range_val > 100:
            return (
                jsonify(
                    {"status": "error", "message": "Range cannot exceed 100 registers"}
                ),
                400,
            )

        # Read the registers
        try:
            if range_val == 1:
                value = register_value(
                    runtime.modbus.read_register_holding(register, unit_id)
                )
                runtime.info(f"Read register {register} from unit {unit_id}: {value}")
                return jsonify(
                    {
                        "status": "success",
                        "register": register,
                        "unitId": unit_id,
                        "value": value,
                    }
                )
            else:
                value = register_values(
                    runtime.modbus.read_register_holding(register, unit_id, range_val)
                )

                runtime.info(
                    f"Read {range_val} registers starting at {register} from unit {unit_id}"
                )
                return jsonify(
                    {
                        "status": "success",
                        "unitId": unit_id,
                        "startRegister": register,
                        "range": range_val,
                        "value": value,
                    }
                )
        except Exception as e:
            runtime.error(f"Error reading Modbus register: {str(e)}")
            return (
                jsonify(
                    {"status": "error", "message": f"Error reading register: {str(e)}"}
                ),
                500,
            )

    @router.route("/api/modbus/write", methods=["POST"])
    @runtime.handle_connection_errors
    def write_modbus():
        """Write to Modbus register"""
        data = request.get_json()

        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400

        unit_id = data.get("unitId")
        register = data.get("register")
        value = data.get("value")

        if unit_id is None or register is None or value is None:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Missing required parameters: unitId, register, and value",
                    }
                ),
                400,
            )

        # Write to the register
        try:
            runtime.modbus.write_register(register, value, unit_id)
            runtime.info(
                f"Wrote value {value} to register {register} on unit {unit_id}"
            )
            return jsonify(
                {
                    "status": "success",
                    "message": f"Successfully wrote {value} to register {register}",
                    "register": register,
                    "unitId": unit_id,
                    "value": value,
                }
            )
        except Exception as e:
            runtime.error(f"Error writing to Modbus register: {str(e)}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Error writing to register: {str(e)}",
                    }
                ),
                500,
            )

    @router.route("/health", methods=["GET"])
    def health_check():
        """API health check endpoint"""
        try:
            runtime.modbus.read_register_holding(1, 3)
            return jsonify(
                {
                    "status": "healthy",
                    "message": "API is running and Modbus connection is active",
                }
            )
        except Exception as e:
            return (
                jsonify(
                    {
                        "status": "unhealthy",
                        "message": f"Modbus connection error: {str(e)}",
                    }
                ),
                503,
            )

    return {
        "get_rs485_status": get_rs485_status,
        "read_modbus": read_modbus,
        "write_modbus": write_modbus,
        "health_check": health_check,
    }
