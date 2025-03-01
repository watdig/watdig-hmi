from flask import Flask, jsonify, request
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from Services.database_service import Database as db
import sqlite3
from flask_cors import CORS
import threading
from Services.modbus_service import ModbusConnection
from Services.logger_service import info, error
from Models.ModbusDB.operating_data_table import OperatingData

def create_app():
    app = Flask(__name__)
    CORS(app)
    return app

def run_server():
    app = create_app()
    app.run(use_reloader=False, host='0.0.0.0', port=8080)

# Start instance of Modbus Connection and Flask App
modbus = ModbusConnection()
app = create_app()

@app.route('/api/startup-sequence', methods=['GET'])
def startup_sequence():
    modbus.write_register(0, 0b110, 1)
    time.sleep(0.1)
    modbus.write_register(0, 0b111, 1)
    modbus.write_register(0, 0b1111, 1)
    modbus.write_register(0, 0b101111, 1)
    modbus.write_register(0, 0b1101111, 1)

@app.route('/api/stop-motor', methods=['GET'])
def stop_motor():
    modbus.write_register(0, 0, 1)

@app.route('/api/reverse-motor', methods=['GET'])
def reverse_motor():
    modbus.write_register(0, 0, 1)

@app.route('/api/set-frequency', methods=['POST'])
def set_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 1)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/revese-frequency', methods=['POST'])
def reverse_frequency():
    """Set the VFD frequency based on the provided value"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
        
        frequency = data.get('frequency')
        if frequency is None:
            return jsonify({"status": "error", "message": "No frequency value provided"}), 400
        
        # Convert to integer and ensure it's within valid range
        frequency = int(frequency)
        if -20000 <= frequency <= 20000:  # Allow negative values for reverse
            try:
                modbus.write_register(1, frequency, 1)
                info(f"Successfully set frequency to {frequency} ({(frequency * 60/20000):.1f} Hz)")
                return jsonify({
                    "status": "success",
                    "message": "Frequency set successfully",
                    "value": frequency
                }), 200
            except Exception as e:
                error(f"Modbus error writing frequency: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Modbus error: {str(e)}"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Frequency value {frequency} is out of range (-20000 to 20000)"
            }), 400
            
    except Exception as e:
        error(f"Error in set_frequency: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({
                "error": "Modbus communication error",
                "details": str(e)
            }), 503
    return wrapper

# Helper function to format response with units
def format_response(value, name, unit="", scale_factor=1):
    return jsonify({
        name: {
            "value": value * scale_factor,
            "unit": unit
        }
    })

'''
OPERATING DATA REGISTERS
'''

@app.route('/api/data/speed-dir', methods=['GET'])
@handle_modbus_errors
def get_speed_dir():
    """Get motor speed and direction (-30000 to 30000 rpm)"""
    speed = modbus.read_register(100, 1)
    return format_response(speed, "Speed & Direction", "rpm")

@app.route('/api/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus.read_register(102, 1)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@app.route('/api/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus.read_register(103, 1)
    return format_response(current, "Current", "A", 0.1)

@app.route('/api/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus.read_register(104, 1)
    return format_response(torque, "Torque", "%")

@app.route('/api/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus.read_register(105, 1)
    return format_response(power, "Power", "kW", 0.1)

@app.route('/api/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus.read_register(106, 1)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@app.route('/api/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus.read_register(108, 1)
    return format_response(output_voltage, "Output Voltage", "V")

@app.route('/api/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus.read_register(109, 1)
    return format_response(drive_temp, "Drive Temperature", "°C")

@app.route('/api/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus.read_register(149, 1)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@app.route('/api/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus.read_register(152, 1)
    return format_response(mot_therm_stress, "Motor Thermal Stress", "%")

'''
FAULT HISTORY REGISTERS
'''

@app.route('/api/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus.read_register(401, 1)
    return format_response(latest_fault, "Latest Fault", "code")

@app.route('/api/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus.read_register(404, 1)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@app.route('/api/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus.read_register(405, 1)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@app.route('/api/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus.read_register(406, 1)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@app.route('/api/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus.read_register(407, 1)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@app.route('/api/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus.read_register(408, 1)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@app.route('/api/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus.read_register(409, 1)
    return format_response(status_at_fault, "Status at Fault", "code")

@app.route('/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    try:
        modbus.read_register(101)
        return jsonify({
            "status": "healthy",
            "message": "API is running and Modbus connection is active"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": f"Modbus connection error: {str(e)}"
        }), 503


@app.route('/api/data/operating', methods=['GET'])
def get_operating_data():
    try:
        rows = db.get_recent_operating_data()
        return jsonify([row.to_dict() for row in rows])
    except Exception as e:
        error(f"Error fetching operating data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/wp/data/operating', methods=['GET'])
def get_operating_data():
    try:
        rows = db.get_recent_operating_data_water_pump()
        return jsonify([row.to_dict() for row in rows])
    except Exception as e:
        error(f"Error fetching operating data for waterpump: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    run_server()
