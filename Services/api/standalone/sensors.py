"""Sensors routes; runtime supplies shared device state and services."""

from flask import jsonify, request


def register_routes(router, runtime):
    @router.route("/api/bg/motor-temp", methods=["GET"])
    def get_motor_temp():
        response = runtime.modbus_client.read_register_holding(12, 5)
        print(response.registers[0])
        if hasattr(response, "registers") and len(response.registers) > 0:
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

    @router.route("/api/bg/earth-preassure", methods=["GET"])
    def get_earth_pressure():
        response = runtime.modbus_client.read_register_holding(13, 5)
        if hasattr(response, "registers") and len(response.registers) > 0:
            return jsonify(response.registers[0])
        return jsonify(None)

    @router.route("/api/bg/flame", methods=["GET"])
    def get_flame():
        response = runtime.modbus_client.read_register_holding(14, 5)
        if hasattr(response, "registers") and len(response.registers) > 0:
            return jsonify(response.registers[0])
        return jsonify(None)

    @router.route("/api/bg/encoder-speed", methods=["GET"])
    def get_encoder_speed():
        response = runtime.modbus_client.read_register_holding(62, 5)
        if hasattr(response, "registers") and len(response.registers) > 0:
            return jsonify(response.registers[0])
        return jsonify(None)

    @router.route("/api/ag/water-preassure", methods=["GET"])
    def get_water_pressure():
        try:
            value = runtime.modbus_client.read_register_holding(11, 6)
            # Check if value is a successful response with registers
            if hasattr(value, "registers"):
                return jsonify(value.registers[0])
            else:
                # This is an error response, handle it gracefully
                return (
                    jsonify({"error": "Failed to read water pressure", "value": None}),
                    200,
                )
        except Exception as e:
            # Log the exception but return a valid response
            print(f"Error reading water pressure: {str(e)}")
            return jsonify({"error": str(e), "value": None}), 200

    return {
        "get_motor_temp": get_motor_temp,
        "get_earth_pressure": get_earth_pressure,
        "get_flame": get_flame,
        "get_encoder_speed": get_encoder_speed,
        "get_water_pressure": get_water_pressure,
    }
