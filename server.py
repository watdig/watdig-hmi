from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient

app = Flask(__name__)

# Modbus client configuration
client = ModbusClient(port='/dev/tty.SLAB_USBtoUART', baudrate=9600, timeout=1)
client.connect()

def read_register(register):
    # Reads the value from the register (holding registers)
    result = client.read_holding_registers(register, 1, unit=1)
    return result.registers[0]

'''
            OPERATING DATA REGISTERS
'''

@app.route('/api/data/speed-dir', methods=['GET'])
#Range: -30000 - 30000 rpm
def get_speed_dir():
    speed = read_register(101)
    return jsonify({"Speed & Dir": speed})

@app.route('/api/data/output-frequency', methods=['GET'])
#Range: 0.0 - 500Hz
def get_output_freq():
    frequency = read_register(103)
    return jsonify({"output frequency": frequency})

@app.route('/api/data/current', methods=['GET'])
#Range: 0.0 - 2.0 * I2hd
def get_current():
    current = read_register(104)
    return jsonify({"current": current})

@app.route('/api/data/torque', methods=['GET'])
#Range: -200 - 200%
def get_torque():
    torque = read_register(105)
    return jsonify({"torque": torque})

@app.route('/api/data/power', methods=['GET'])
def get_power():
    power = read_register(106)
    return jsonify({"power": power})

@app.route('/api/data/dc-bus-voltage', methods=['GET'])
def get_dc_bus_voltage():
    dc_bus_voltage = read_register(107)
    return jsonify({"DC Bus Voltage": dc_bus_voltage})

@app.route('/api/data/output-voltage', methods=['GET'])
def output_voltage():
    output_voltage = read_register(109)
    return jsonify({"Output Voltage": output_voltage})

@app.route('/api/data/drive-temp', methods=['GET'])
def drive_temp():
    drive_temp = read_register(110)
    return jsonify({"Drive Temp": drive_temp})

@app.route('/api/data/drive-cb-temp', methods=['GET'])
def cb_temp():
    cb_temp = read_register(150)
    return jsonify({"Drive CB Temp": cb_temp})

@app.route('/api/data/mot-therm-stress', methods=['GET'])
def mot_therm_stress():
    mot_therm_stress = read_register(153)
    return jsonify({"Mot Therm Stress": mot_therm_stress})


'''
                    FAULT HISTORY REGISTERS
'''

@app.route('/api/fault/latest-fault', methods=['GET'])
def latest_fault():
    latest_fault = read_register(401)
    return jsonify({"Latest Fault": latest_fault})

@app.route('/api/fault/speed-at-fault', methods=['GET'])
def speed_at_fault():
    speed_at_fault = read_register(404)
    return jsonify({"Speed at Fault": speed_at_fault})

@app.route('/api/fault/freq-at-fault', methods=['GET'])
def freq_at_fault():
    freq_at_fault = read_register(405)
    return jsonify({"Freq at Fault": freq_at_fault})

@app.route('/api/fault/voltage-at-fault', methods=['GET'])
def voltage_at_fault():
    freq_at_fault = read_register(406)
    return jsonify({"Freq at Fault": freq_at_fault})

@app.route('/api/fault/current-at-fault', methods=['GET'])
def current_at_fault():
    current_at_fault = read_register(407)
    return jsonify({"Current at Fault": current_at_fault})

@app.route('/api/fault/torque-at-fault', methods=['GET'])
def torque_at_fault():
    torque_at_fault = read_register(408)
    return jsonify({"Torque at Fault": torque_at_fault})

@app.route('/api/fault/status-at-fault', methods=['GET'])
def status_at_fault():
    status_at_fault = read_register(409)
    return jsonify({"Status at Fault": status_at_fault})

'''
                    START/STOP/DIR REGISTERS
'''



if __name__ == '__main__':
    app.run(debug=True)
