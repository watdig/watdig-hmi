"""Sensors routes; runtime supplies shared device state and services."""

from flask import jsonify, request


def register_routes(router, runtime):
    @router.route("/api/bg/get-thrustTop", methods=["GET"])
    def get_thrustTop():
        value = runtime.modbus.read_register_holding(9, 5)
        return value

    @router.route("/api/bg/get-thrustLeft", methods=["GET"])
    def get_thrustLeft():
        value = runtime.modbus.read_register_holding(10, 5)
        return jsonify(value)

    @router.route("/api/bg/get-thrustRight", methods=["GET"])
    def get_thrustRight():
        value = runtime.modbus.read_register_holding(11, 5)
        return jsonify(value)

    @router.route("/api/bg/motor-temp", methods=["GET"])
    def get_motor_temp():
        value = runtime.modbus.read_register_holding(12, 5)
        return jsonify(value)

    @router.route("/api/bg/earth-preassure", methods=["GET"])
    def get_earth_pressure():
        value = runtime.modbus.read_register_holding(13, 5)
        return jsonify(value)

    @router.route("/api/bg/flame", methods=["GET"])
    def get_flame():
        value = runtime.modbus.read_register_holding(14, 5)
        return jsonify(value)

    @router.route("/api/bg/actuator-A", methods=["GET"])
    def get_actuator_a():
        value = runtime.modbus.read_register_holding(15, 5)
        return jsonify(value)

    @router.route("/api/bg/actuator-B", methods=["GET"])
    def get_actuator_b():
        value = runtime.modbus.read_register_holding(16, 5)
        return jsonify(value)

    @router.route("/api/bg/actuator-C", methods=["GET"])
    def get_actuator_c():
        value = runtime.modbus.read_register_holding(17, 5)
        return jsonify(value)

    @router.route("/api/bg/encoder-speed", methods=["GET"])
    def get_encoder_speed():
        value = runtime.modbus.read_register_holding(62, 5)
        return value

    @router.route("/api/ag/oil-preassure", methods=["GET"])
    def get_oil_pressure():
        value = runtime.modbus.read_register_holding(12, 6)
        return jsonify(value)

    @router.route("/api/ag/oil-temp", methods=["GET"])
    def get_oil_temp():
        value = runtime.modbus.read_register_holding(10, 6)
        return jsonify(value)

    return {
        "get_thrustTop": get_thrustTop,
        "get_thrustLeft": get_thrustLeft,
        "get_thrustRight": get_thrustRight,
        "get_motor_temp": get_motor_temp,
        "get_earth_pressure": get_earth_pressure,
        "get_flame": get_flame,
        "get_actuator_a": get_actuator_a,
        "get_actuator_b": get_actuator_b,
        "get_actuator_c": get_actuator_c,
        "get_encoder_speed": get_encoder_speed,
        "get_oil_pressure": get_oil_pressure,
        "get_oil_temp": get_oil_temp,
    }
