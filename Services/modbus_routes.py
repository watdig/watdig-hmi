"""Standalone application entry point; HTTP handlers live in Services.api.standalone."""

import os
import sys
import time
from functools import wraps
from threading import Thread

# Preserve direct execution via `python Services/modbus_routes.py`.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Services.api.standalone.connection import register_routes as register_connection
from Services.api.standalone.pump import register_routes as register_pump
from Services.api.standalone.motors import register_routes as register_motors
from Services.api.standalone.telemetry import register_routes as register_telemetry
from Services.api.standalone.sensors import register_routes as register_sensors

from flask import Blueprint, Flask, jsonify
from flask_cors import CORS

from Services.database_service import Database as db
from Services.logger_service import info, error
from Services.modbus_service import ModbusConnection
from Services.control.pid_controller import WaterPumpSimulation

modbus_bp = Blueprint("modbus", __name__)

modbus_client = ModbusConnection()

modbus_client.initialize()

water_pump_sim = WaterPumpSimulation()

pid_control_active = False

target_pressure = 0

WATER_PUMP_STATE_REGISTER = 1  # Example register for water pump state

VFD_FREQUENCY_REGISTER = 2  # Example register for VFD frequency


def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            # Apply a timeout to the function execution
            return f(*args, **kwargs)
        except Exception as e:
            # Log the error but don't allow it to block the server
            error(f"Error in {f.__name__}: {str(e)}")
            # Return a simple error response
            return (
                jsonify(
                    {
                        "error": "Modbus communication error",
                        "details": str(e),
                        "status": "error",
                    }
                ),
                503,
            )

    return wrapper


def format_response(value, name, unit="", scale_factor=1):
    return jsonify({name: {"value": value * scale_factor, "unit": unit}})


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register the blueprint with no prefix when running standalone
    app.register_blueprint(modbus_bp)

    # Add a root route for testing
    @app.route("/")
    def index():
        return jsonify(
            {
                "status": "running",
                "message": "Modbus API server is running",
                "endpoints": [
                    "/read",
                    "/write",
                    "/pm480/V1N",
                    "/pm480/V2N",
                    "/pm480/V3N",
                    "/pm480/I1",
                    "/pm480/I2",
                    "/pm120/V1N",
                    "/pm120/V2N",
                    "/pm120/V3N",
                    "/pm120/I1",
                    "/pm120/I2",
                    "/api/startup-sequence",
                ],
            }
        )

    return app


# Keep public handler names and live module state compatible with existing callers.
globals().update(register_connection(modbus_bp, sys.modules[__name__]))
globals().update(register_pump(modbus_bp, sys.modules[__name__]))
globals().update(register_motors(modbus_bp, sys.modules[__name__]))
globals().update(register_telemetry(modbus_bp, sys.modules[__name__]))
globals().update(register_sensors(modbus_bp, sys.modules[__name__]))

if __name__ == "__main__":
    app = create_app()
    info("Starting Modbus API server on http://127.0.0.1:5000")
    try:
        # Run with threaded=True to handle multiple requests
        app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
    except KeyboardInterrupt:
        info("Server stopped by user")
    except Exception as e:
        error(f"Server error: {str(e)}")
    finally:
        # Clean up resources
        if hasattr(modbus_client, "client") and modbus_client.client:
            try:
                modbus_client.client.close()
                info("Modbus connection closed")
            except Exception as e:
                error(f"Error closing Modbus connection: {str(e)}")
