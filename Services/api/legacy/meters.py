"""Meters routes; runtime supplies shared device state and services."""

from flask import jsonify, request
import struct


def register_routes(router, runtime):
    @router.route("/api/pm480/V1N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V1N():
        x = runtime.modbus.read_register_input(8, 3) & 0xFFFF
        y = (runtime.modbus.read_register_input(9, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/V2N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V2N():
        x = runtime.modbus.read_register_input(10, 3) & 0xFFFF
        y = (runtime.modbus.read_register_input(11, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/V3N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V3N():
        x = runtime.modbus.read_register_input(12, 3) & 0xFFFF
        y = (runtime.modbus.read_register_input(13, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/I1", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_I1():
        x = runtime.modbus.read_register_input(16, 3) & 0xFFFF
        y = (runtime.modbus.read_register_input(17, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/I2", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_I2():
        x = runtime.modbus.read_register_input(18, 3) & 0xFFFF
        y = (runtime.modbus.read_register_input(19, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V1N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V1N():
        x = runtime.modbus.read_register_input(0, 4) & 0xFFFF
        y = (runtime.modbus.read_register_input(1, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V2N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V2N():
        x = runtime.modbus.read_register_input(2, 4) & 0xFFFF
        y = (runtime.modbus.read_register_input(3, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V3N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V3N():
        x = runtime.modbus.read_register_input(4, 4) & 0xFFFF
        y = (runtime.modbus.read_register_input(5, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/I1", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_I1():
        x = runtime.modbus.read_register_input(16, 4) & 0xFFFF
        y = (runtime.modbus.read_register_input(17, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/I2", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_I2():
        x = runtime.modbus.read_register_input(18, 4) & 0xFFFF
        y = (runtime.modbus.read_register_input(19, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    return {
        "get_480_V1N": get_480_V1N,
        "get_480_V2N": get_480_V2N,
        "get_480_V3N": get_480_V3N,
        "get_480_I1": get_480_I1,
        "get_480_I2": get_480_I2,
        "get_120_V1N": get_120_V1N,
        "get_120_V2N": get_120_V2N,
        "get_120_V3N": get_120_V3N,
        "get_120_I1": get_120_I1,
        "get_120_I2": get_120_I2,
    }
