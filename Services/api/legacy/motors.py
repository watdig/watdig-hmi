"""Motors routes; runtime supplies shared device state and services."""

from flask import jsonify, request


def register_routes(router, runtime):
    @router.route("/api/startup-sequence", methods=["GET"])
    def startup_sequence():
        runtime.modbus.write_register(0, 0b110, 1)
        runtime.time.sleep(0.1)
        runtime.modbus.write_register(0, 0b111, 1)
        runtime.modbus.write_register(0, 0b1111, 1)
        runtime.modbus.write_register(0, 0b101111, 1)
        runtime.modbus.write_register(0, 0b1101111, 1)
        return jsonify({"status": "success", "message": "Startup sequence completed"})

    @router.route("/api/stop-motor", methods=["GET"])
    def stop_motor():
        runtime.modbus.write_register(0, 0, 1)
        return jsonify({"status": "success", "message": "Motor stopped"})

    @router.route("/api/reverse-motor", methods=["GET"])
    def reverse_motor():
        runtime.modbus.write_register(0, 0, 1)
        return jsonify({"status": "success", "message": "Motor reversed"})

    @router.route("/api/set-frequency", methods=["POST"])
    def set_frequency():
        """Set the VFD frequency based on the provided value"""
        try:
            data = request.get_json()
            if data is None:
                return (
                    jsonify({"status": "error", "message": "No JSON data received"}),
                    400,
                )

            frequency = data.get("frequency")
            if frequency is None:
                return (
                    jsonify(
                        {"status": "error", "message": "No frequency value provided"}
                    ),
                    400,
                )

            # Convert to integer and ensure it's within valid range
            frequency = int(frequency)
            if -20000 <= frequency <= 20000:  # Allow negative values for reverse
                try:
                    runtime.modbus.write_register(1, frequency, 1)
                    runtime.info(
                        f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)"
                    )
                    return (
                        jsonify(
                            {
                                "status": "success",
                                "message": "Frequency set successfully",
                                "value": frequency,
                            }
                        ),
                        200,
                    )
                except Exception as e:
                    runtime.error(f"Modbus error writing frequency: {str(e)}")
                    return (
                        jsonify(
                            {"status": "error", "message": f"Modbus error: {str(e)}"}
                        ),
                        500,
                    )
            else:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Frequency value {frequency} is out of range (-20000 to 20000)",
                        }
                    ),
                    400,
                )

        except Exception as e:
            runtime.error(f"Error in set_frequency: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    @router.route("/api/revese-frequency", methods=["POST"])
    def reverse_frequency():
        """Set the VFD frequency based on the provided value"""
        try:
            data = request.get_json()
            if data is None:
                return (
                    jsonify({"status": "error", "message": "No JSON data received"}),
                    400,
                )

            frequency = data.get("frequency")
            if frequency is None:
                return (
                    jsonify(
                        {"status": "error", "message": "No frequency value provided"}
                    ),
                    400,
                )

            # Convert to integer and ensure it's within valid range
            frequency = int(frequency)
            if -20000 <= frequency <= 20000:  # Allow negative values for reverse
                try:
                    runtime.modbus.write_register(1, frequency, 1)
                    runtime.info(
                        f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)"
                    )
                    return (
                        jsonify(
                            {
                                "status": "success",
                                "message": "Frequency set successfully",
                                "value": frequency,
                            }
                        ),
                        200,
                    )
                except Exception as e:
                    runtime.error(f"Modbus error writing frequency: {str(e)}")
                    return (
                        jsonify(
                            {"status": "error", "message": f"Modbus error: {str(e)}"}
                        ),
                        500,
                    )
            else:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Frequency value {frequency} is out of range (-20000 to 20000)",
                        }
                    ),
                    400,
                )

        except Exception as e:
            runtime.error(f"Error in set_frequency: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    @router.route("/api/pm/set-120V", methods=["POST"])
    def set_120V():
        try:
            data = request.get_json()
            value = data.get("value", 0)  # Get the value from request, default to 0
            runtime.modbus.write_register(6, value, 7)
            return jsonify(
                {"status": "success", "message": f"120V set to {value} successfully"}
            )
        except Exception as e:
            runtime.error(f"Error setting 120V: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    @router.route("/api/pm/set-480V", methods=["POST"])
    def set_480():
        try:
            data = request.get_json()
            value = data.get("value", 0)
            runtime.modbus.write_register(6, data, 7)
            return jsonify({"status": "success", "message": "480V set successfully"})
        except Exception as e:
            runtime.error(f"Error setting 480V: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    return {
        "startup_sequence": startup_sequence,
        "stop_motor": stop_motor,
        "reverse_motor": reverse_motor,
        "set_frequency": set_frequency,
        "reverse_frequency": reverse_frequency,
        "set_120V": set_120V,
        "set_480": set_480,
    }
