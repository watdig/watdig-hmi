"""Meters routes; runtime supplies shared device state and services."""

from flask import jsonify, request
import struct

from Services.modbus_values import register_value


def _read_word(runtime, address, unit_id):
    return register_value(runtime.modbus.read_register_input(address, unit_id))


def register_routes(router, runtime):
    @router.route("/api/pm480/V1N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V1N():
        x = _read_word(runtime, 8, 3) & 0xFFFF
        y = (_read_word(runtime, 9, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/V2N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V2N():
        x = _read_word(runtime, 10, 3) & 0xFFFF
        y = (_read_word(runtime, 11, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/V3N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_V3N():
        x = _read_word(runtime, 12, 3) & 0xFFFF
        y = (_read_word(runtime, 13, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/I1", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_I1():
        x = _read_word(runtime, 16, 3) & 0xFFFF
        y = (_read_word(runtime, 17, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm480/I2", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_480_I2():
        x = _read_word(runtime, 18, 3) & 0xFFFF
        y = (_read_word(runtime, 19, 3) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V1N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V1N():
        x = _read_word(runtime, 0, 4) & 0xFFFF
        y = (_read_word(runtime, 1, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V2N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V2N():
        x = _read_word(runtime, 2, 4) & 0xFFFF
        y = (_read_word(runtime, 3, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/V3N", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_V3N():
        x = _read_word(runtime, 4, 4) & 0xFFFF
        y = (_read_word(runtime, 5, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/I1", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_I1():
        x = _read_word(runtime, 16, 4) & 0xFFFF
        y = (_read_word(runtime, 17, 4) & 0xFFFF) << 16

        z = x + y

        float_value = struct.unpack("<f", struct.pack("<I", z))[0]
        return jsonify(float_value)

    @router.route("/api/pm120/I2", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_120_I2():
        x = _read_word(runtime, 18, 4) & 0xFFFF
        y = (_read_word(runtime, 19, 4) & 0xFFFF) << 16

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
