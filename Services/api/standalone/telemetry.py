"""Telemetry routes; runtime supplies shared device state and services."""

from flask import jsonify, request


def register_routes(router, runtime):
    @router.route("/api/data/speed-dir", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_speed_dir():
        """Get motor speed and direction (-30000 to 30000 rpm)"""
        speed = runtime.modbus_client.read_register_holding(100, 1)
        return runtime.format_response(speed, "Speed & Direction", "rpm")

    @router.route("/api/data/output-frequency", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_output_freq():
        """Get output frequency (0.0 - 500Hz)"""
        frequency = runtime.modbus_client.read_register_holding(102, 1)
        return runtime.format_response(frequency, "Output Frequency", "Hz", 0.1)

    @router.route("/api/data/current", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_current():
        """Get current (0.0 - 2.0 * I2hd)"""
        current = runtime.modbus_client.read_register_holding(103, 1)
        return runtime.format_response(current, "Current", "A", 0.1)

    @router.route("/api/data/torque", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_torque():
        """Get torque (-200 to 200%)"""
        torque = runtime.modbus_client.read_register_holding(104, 1)
        return runtime.format_response(torque, "Torque", "%")

    @router.route("/api/data/power", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_power():
        """Get power output"""
        power = runtime.modbus_client.read_register_holding(105, 1)
        return runtime.format_response(power, "Power", "kW", 0.1)

    @router.route("/api/data/dc-bus-voltage", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_dc_bus_voltage():
        """Get DC bus voltage"""
        dc_bus_voltage = runtime.modbus_client.read_register_holding(106, 1)
        return runtime.format_response(dc_bus_voltage, "DC Bus Voltage", "V")

    @router.route("/api/data/output-voltage", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_output_voltage():
        """Get output voltage"""
        output_voltage = runtime.modbus_client.read_register_holding(108, 1)
        return runtime.format_response(output_voltage, "Output Voltage", "V")

    @router.route("/api/data/drive-temp", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_drive_temp():
        """Get drive temperature"""
        drive_temp = runtime.modbus_client.read_register_holding(109, 1)
        return runtime.format_response(drive_temp, "Drive Temperature", "°C")

    @router.route("/api/data/drive-cb-temp", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_cb_temp():
        """Get drive control board temperature"""
        cb_temp = runtime.modbus_client.read_register_holding(149, 1)
        return runtime.format_response(cb_temp, "Drive CB Temperature", "°C")

    @router.route("/api/data/mot-therm-stress", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_mot_therm_stress():
        """Get motor thermal stress level"""
        mot_therm_stress = runtime.modbus_client.read_register_holding(152, 2)
        return jsonify(mot_therm_stress)

    @router.route("/api/fault/latest-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_latest_fault():
        """Get latest fault code"""
        latest_fault = runtime.modbus_client.read_register_holding(401, 1)
        return runtime.format_response(latest_fault, "Latest Fault", "code")

    @router.route("/api/fault/speed-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_speed_at_fault():
        """Get speed at time of fault"""
        speed_at_fault = runtime.modbus_client.read_register_holding(404, 1)
        return runtime.format_response(speed_at_fault, "Speed at Fault", "rpm")

    @router.route("/api/fault/freq-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_freq_at_fault():
        """Get frequency at time of fault"""
        freq_at_fault = runtime.modbus_client.read_register_holding(405, 1)
        return runtime.format_response(freq_at_fault, "Frequency at Fault", "Hz", 0.1)

    @router.route("/api/fault/voltage-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_voltage_at_fault():
        """Get voltage at time of fault"""
        voltage_at_fault = runtime.modbus_client.read_register_holding(406, 1)
        return runtime.format_response(voltage_at_fault, "Voltage at Fault", "V")

    @router.route("/api/fault/current-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_current_at_fault():
        """Get current at time of fault"""
        current_at_fault = runtime.modbus_client.read_register_holding(407, 1)
        return runtime.format_response(current_at_fault, "Current at Fault", "A", 0.1)

    @router.route("/api/fault/torque-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_torque_at_fault():
        """Get torque at time of fault"""
        torque_at_fault = runtime.modbus_client.read_register_holding(408, 1)
        return runtime.format_response(torque_at_fault, "Torque at Fault", "%")

    @router.route("/api/fault/status-at-fault", methods=["GET"])
    @runtime.handle_modbus_errors
    def get_status_at_fault():
        """Get status at time of fault"""
        status_at_fault = runtime.modbus_client.read_register_holding(409, 1)
        return runtime.format_response(status_at_fault, "Status at Fault", "code")

    @router.route("/api/data/operating", methods=["GET"])
    def get_operating_data():
        try:
            rows = runtime.db.get_recent_operating_data()
            return jsonify([row.to_dict() for row in rows])
        except Exception as e:
            runtime.error(f"Error fetching operating data: {str(e)}")
            return jsonify({"error": str(e)}), 500

    return {
        "get_speed_dir": get_speed_dir,
        "get_output_freq": get_output_freq,
        "get_current": get_current,
        "get_torque": get_torque,
        "get_power": get_power,
        "get_dc_bus_voltage": get_dc_bus_voltage,
        "get_output_voltage": get_output_voltage,
        "get_drive_temp": get_drive_temp,
        "get_cb_temp": get_cb_temp,
        "get_mot_therm_stress": get_mot_therm_stress,
        "get_latest_fault": get_latest_fault,
        "get_speed_at_fault": get_speed_at_fault,
        "get_freq_at_fault": get_freq_at_fault,
        "get_voltage_at_fault": get_voltage_at_fault,
        "get_current_at_fault": get_current_at_fault,
        "get_torque_at_fault": get_torque_at_fault,
        "get_status_at_fault": get_status_at_fault,
        "get_operating_data": get_operating_data,
    }
