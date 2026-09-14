"""Legacy application entry point; HTTP handlers live in Services.api.legacy."""

from Services.api.legacy.connection import register_routes as register_connection
from Services.api.legacy.motors import register_routes as register_motors
from Services.api.legacy.telemetry import register_routes as register_telemetry
from Services.api.legacy.sensors import register_routes as register_sensors
from Services.api.legacy.meters import register_routes as register_meters

import atexit
import sys
import time
from functools import wraps

from flask import Flask, jsonify
from flask_cors import CORS

from Services.database_service import Database as db
from Services.logger_service import info, error
from Services.modbus_service import ModbusConnection
from Services.modbus_values import register_value

MAX_RETRIES = 3  # Maximum number of connection attempts

RETRY_DELAY = 2  # Seconds between retries

app = Flask(__name__)

CORS(app)

modbus = None

rs485_connected = False


def cleanup_modbus():
    global modbus
    if modbus and hasattr(modbus, "client"):
        try:
            modbus.client.close()
            info("Modbus connection closed during cleanup")
        except Exception as e:
            error(f"Error during Modbus cleanup: {str(e)}")


atexit.register(cleanup_modbus)


def run_server():
    global modbus, rs485_connected

    # Clean up any existing connection first
    cleanup_modbus()

    # Try to establish Modbus connection
    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            modbus = ModbusConnection()
            rs485_connected = True
            info("Successfully connected to RS485")
            break
        except Exception as e:
            retry_count += 1
            error(
                f"Failed to connect to RS485 (Attempt {retry_count}/{MAX_RETRIES}): {str(e)}"
            )
            if retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            else:
                error("Failed to establish RS485 connection after maximum retries")
                rs485_connected = False
                break

    try:
        app.run(use_reloader=False, host="0.0.0.0", port=8080)
    finally:
        cleanup_modbus()


def handle_connection_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not rs485_connected:
            return (
                jsonify(
                    {"status": "error", "message": "RS485 connection is not available"}
                ),
                503,
            )
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error(f"Modbus error in {f.__name__}: {str(e)}")
            return (
                jsonify({"status": "error", "message": f"Modbus error: {str(e)}"}),
                500,
            )

    return decorated_function


def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error(f"Error in {f.__name__}: {str(e)}")
            return (
                jsonify({"error": "Modbus communication error", "details": str(e)}),
                503,
            )

    return wrapper


def format_response(value, name, unit="", scale_factor=1):
    value = register_value(value)
    return jsonify({name: {"value": value * scale_factor, "unit": unit}})


# Keep public handler names and live module state compatible with existing callers.
globals().update(register_connection(app, sys.modules[__name__]))
globals().update(register_motors(app, sys.modules[__name__]))
globals().update(register_telemetry(app, sys.modules[__name__]))
globals().update(register_sensors(app, sys.modules[__name__]))
globals().update(register_meters(app, sys.modules[__name__]))

if __name__ == "__main__":
    run_server()
