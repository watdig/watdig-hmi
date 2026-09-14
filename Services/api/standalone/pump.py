"""Pump routes; runtime supplies shared device state and services."""

from flask import jsonify, request
import traceback


def register_routes(router, runtime):
    @router.route("/api/modbus/water_pump_pid", methods=["POST"])
    def water_pump_pid():
        try:
            data = request.get_json()
            # Convert target pressure from PSI to bar for internal processing
            target_pressure_psi = data.get("target_pressure", 0)
            runtime.target_pressure = (
                target_pressure_psi / 14.5038
            )  # Convert PSI to bar

            # Turn on the water pump first
            runtime.modbus_client.write_register(
                runtime.WATER_PUMP_STATE_REGISTER, 1
            )  # 1 for ON
            runtime.pid_control_active = True

            # Start PID control loop in a background thread
            def pid_loop():
                while runtime.pid_control_active:
                    try:
                        result = runtime.water_pump_sim.update(
                            runtime.target_pressure, dt=0.1
                        )
                        # Update the VFD frequency through modbus
                        runtime.modbus_client.write_register(
                            runtime.VFD_FREQUENCY_REGISTER,
                            int(result["frequency"] * 100),
                        )
                        runtime.time.sleep(0.1)
                    except Exception as e:
                        runtime.error(f"Error in PID loop: {str(e)}")
                        break

            thread = runtime.Thread(target=pid_loop)
            thread.daemon = True
            thread.start()

            return jsonify({"status": "success", "message": "PID control started"})

        except Exception as e:
            runtime.error(
                f"Error starting PID control: {str(e)}\n{traceback.format_exc()}"
            )
            return jsonify({"status": "error", "message": str(e)}), 500

    @router.route("/api/modbus/water_pump_pressure", methods=["GET"])
    def get_water_pump_pressure():
        try:
            if not runtime.pid_control_active:
                return jsonify({"pressure": 0})

            pressure = runtime.water_pump_sim.current_pressure
            return jsonify(
                {
                    "pressure": pressure,
                    "frequency": runtime.water_pump_sim.current_frequency,
                }
            )
        except Exception as e:
            runtime.error(f"Error getting pump pressure: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    @router.route("/api/modbus/water_pump", methods=["POST"])
    def control_water_pump():
        try:
            data = request.get_json()
            state = data.get("state", False)

            if not state:
                runtime.pid_control_active = False
                runtime.water_pump_sim.current_pressure = 0
                runtime.water_pump_sim.current_frequency = 0

            runtime.modbus_client.write_register(
                runtime.WATER_PUMP_STATE_REGISTER, 1 if state else 0
            )
            return jsonify({"status": "success"})

        except Exception as e:
            runtime.error(f"Error controlling water pump: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    return {
        "water_pump_pid": water_pump_pid,
        "get_water_pump_pressure": get_water_pump_pressure,
        "control_water_pump": control_water_pump,
    }
