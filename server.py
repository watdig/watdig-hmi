from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from database import Database
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModbusConnection:
    def __init__(self, port='/dev/tty.MEGADUCK3', baudrate=9600, timeout=30):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.client = None
        self.connect()

    def connect(self):
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                # Check and close if already connected
                if self.client and self.client.is_socket_open():
                    self.client.close()

                # Initialize client and attempt connection
                self.client = ModbusClient(
                    port=self.port,
                    baudrate=self.baudrate,
                    timeout=self.timeout
                )

                # Attempt connection
                if self.client.connect():
                    logger.info(f"Successfully connected to Modbus device on {self.port}")
                    return True
                else:
                    raise serial.serialutil.SerialException(f"Failed to open port {self.port}")

            except serial.serialutil.SerialException as e:
                if "Resource temporarily unavailable" in str(e):
                    logger.warning(f"Port {self.port} is temporarily unavailable, retrying...")
                else:
                    logger.error(f"Serial exception on connection attempt {retry_count + 1}: {str(e)}")
                    
                retry_count += 1
                time.sleep(1)  # wait before retrying

            except Exception as e:
                logger.error(f"Connection attempt {retry_count + 1} failed: {str(e)}")
                retry_count += 1
                time.sleep(1)
                
        logger.error("Failed to connect after maximum retries")
        return False

    def read_register(self, register):
        try:
            # Ensure the Modbus client is connected
            if not self.client or not self.client.is_socket_open():
                if not self.connect():
                    raise Exception("Failed to reconnect to Modbus device")

            # Read holding register
            result = self.client.read_holding_registers(register, 1, unit=1)

            # Check for errors
            if result.isError():
                raise Exception(f"Modbus error reading register {register}")

            # Return the first register value
            return result.registers[0]

        except Exception as e:
            logger.error(f"Error reading register {register}: {str(e)}")
            raise

# Create global Modbus connection instance
modbus = ModbusConnection()

@app.route('/api/startup-sequence', methods=['POST'])
def startup_sequence():
    """Initiate the startup sequence for ABB ACS550"""
    
    # Step 1: Send a specific register write to enable motor start command (adjust register and value as needed)
    logger.info("Starting ABB ACS550 motor startup sequence...")

    # Register address (example, you need to check with the ACS550 documentation)
    START_COMMAND_REGISTER = 101  # Example register for startŒ command
    START_COMMAND_VALUE = 1       # Value to send to start the motor (check the specific value required)

    # Write the start command to the register
    modbus.write_single_register(START_COMMAND_REGISTER, START_COMMAND_VALUE)

    # Step 2: Optionally, confirm that the motor has started (checking relevant register for status)
    status_register = 102  # Example register for motor status
    motor_status = modbus.read_register(status_register)

    # Check if motor status indicates it's running (adjust as per ACS550)
    if motor_status == 1:
        logger.info("Motor started successfully")
        return jsonify({
            "status": "success",
            "message": "Motor started successfully"
        })
    else:
        logger.error("Failed to start motor")
        return jsonify({
            "status": "failure",
            "message": "Motor failed to start"
        }), 500
    
def handle_modbus_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
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
    speed = modbus.read_register(101)
    return format_response(speed, "Speed & Direction", "rpm")

@app.route('/api/data/output-frequency', methods=['GET'])
@handle_modbus_errors
def get_output_freq():
    """Get output frequency (0.0 - 500Hz)"""
    frequency = modbus.read_register(103)
    return format_response(frequency, "Output Frequency", "Hz", 0.1)

@app.route('/api/data/current', methods=['GET'])
@handle_modbus_errors
def get_current():
    """Get current (0.0 - 2.0 * I2hd)"""
    current = modbus.read_register(104)
    return format_response(current, "Current", "A", 0.1)

@app.route('/api/data/torque', methods=['GET'])
@handle_modbus_errors
def get_torque():
    """Get torque (-200 to 200%)"""
    torque = modbus.read_register(105)
    return format_response(torque, "Torque", "%")

@app.route('/api/data/power', methods=['GET'])
@handle_modbus_errors
def get_power():
    """Get power output"""
    power = modbus.read_register(106)
    return format_response(power, "Power", "kW", 0.1)

@app.route('/api/data/dc-bus-voltage', methods=['GET'])
@handle_modbus_errors
def get_dc_bus_voltage():
    """Get DC bus voltage"""
    dc_bus_voltage = modbus.read_register(107)
    return format_response(dc_bus_voltage, "DC Bus Voltage", "V")

@app.route('/api/data/output-voltage', methods=['GET'])
@handle_modbus_errors
def get_output_voltage():
    """Get output voltage"""
    output_voltage = modbus.read_register(109)
    return format_response(output_voltage, "Output Voltage", "V")

@app.route('/api/data/drive-temp', methods=['GET'])
@handle_modbus_errors
def get_drive_temp():
    """Get drive temperature"""
    drive_temp = modbus.read_register(110)
    return format_response(drive_temp, "Drive Temperature", "°C")

@app.route('/api/data/drive-cb-temp', methods=['GET'])
@handle_modbus_errors
def get_cb_temp():
    """Get drive control board temperature"""
    cb_temp = modbus.read_register(150)
    return format_response(cb_temp, "Drive CB Temperature", "°C")

@app.route('/api/data/mot-therm-stress', methods=['GET'])
@handle_modbus_errors
def get_mot_therm_stress():
    """Get motor thermal stress level"""
    mot_therm_stress = modbus.read_register(153)
    return format_response(mot_therm_stress, "Motor Thermal Stress", "%")

'''
FAULT HISTORY REGISTERS
'''

@app.route('/api/fault/latest-fault', methods=['GET'])
@handle_modbus_errors
def get_latest_fault():
    """Get latest fault code"""
    latest_fault = modbus.read_register(401)
    return format_response(latest_fault, "Latest Fault", "code")

@app.route('/api/fault/speed-at-fault', methods=['GET'])
@handle_modbus_errors
def get_speed_at_fault():
    """Get speed at time of fault"""
    speed_at_fault = modbus.read_register(404)
    return format_response(speed_at_fault, "Speed at Fault", "rpm")

@app.route('/api/fault/freq-at-fault', methods=['GET'])
@handle_modbus_errors
def get_freq_at_fault():
    """Get frequency at time of fault"""
    freq_at_fault = modbus.read_register(405)
    return format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

@app.route('/api/fault/voltage-at-fault', methods=['GET'])
@handle_modbus_errors
def get_voltage_at_fault():
    """Get voltage at time of fault"""
    voltage_at_fault = modbus.read_register(406)
    return format_response(voltage_at_fault, "Voltage at Fault", "V")

@app.route('/api/fault/current-at-fault', methods=['GET'])
@handle_modbus_errors
def get_current_at_fault():
    """Get current at time of fault"""
    current_at_fault = modbus.read_register(407)
    return format_response(current_at_fault, "Current at Fault", "A", 0.1)

@app.route('/api/fault/torque-at-fault', methods=['GET'])
@handle_modbus_errors
def get_torque_at_fault():
    """Get torque at time of fault"""
    torque_at_fault = modbus.read_register(408)
    return format_response(torque_at_fault, "Torque at Fault", "%")

@app.route('/api/fault/status-at-fault', methods=['GET'])
@handle_modbus_errors
def get_status_at_fault():
    """Get status at time of fault"""
    status_at_fault = modbus.read_register(409)
    return format_response(status_at_fault, "Status at Fault", "code")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    try:
        # Try to read a register to verify Modbus connection
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

db = Database()

@app.route('/api/data/operating', methods=['GET'])
def get_operating_data():
    try:
        conn = sqlite3.connect('modbus_logs.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, speed_rpm, output_frequency, current_amps,
                   torque_percent, power_kw, dc_bus_voltage, output_voltage,
                   drive_temp_c, drive_cb_temp_c, motor_thermal_stress_percent
            FROM operating_data 
            ORDER BY timestamp DESC 
            LIMIT 100
        ''')
        
        columns = ['timestamp', 'speed_rpm', 'output_frequency', 'current_amps',
                  'torque_percent', 'power_kw', 'dc_bus_voltage', 'output_voltage',
                  'drive_temp_c', 'drive_cb_temp_c', 'motor_thermal_stress_percent']
        
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]
        
        conn.close()
        return jsonify(result)
        
    except Exception as e:
        print(f"Error fetching operating data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/faults', methods=['GET'])
def get_fault_data():
    try:
        conn = sqlite3.connect('modbus_logs.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, fault_code, speed_at_fault, frequency_at_fault,
                   voltage_at_fault, current_at_fault, torque_at_fault, status_at_fault
            FROM fault_history 
            ORDER BY timestamp DESC 
            LIMIT 50
        ''')
        
        columns = ['timestamp', 'fault_code', 'speed_at_fault', 'frequency_at_fault',
                  'voltage_at_fault', 'current_at_fault', 'torque_at_fault', 'status_at_fault']
        
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]
        
        conn.close()
        return jsonify(result)
        
    except Exception as e:
        print(f"Error fetching fault data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    '''# Add startup message
    logger.info("Starting Modbus Flask API...")
    logger.info(f"Using port: {modbus.port}")
    logger.info(f"Baudrate: {modbus.baudrate}")'''
    
    # Start Flask app
    app.run(use_reloader=False, host='0.0.0.0', port=8080)
    get_operating_data()
