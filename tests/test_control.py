from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from Services.control import pid_controller
from Test.pid_controller import PIDController, WaterPumpSimulation


def test_old_pid_import_path_remains_compatible():
    assert PIDController is pid_controller.PIDController
    assert WaterPumpSimulation is pid_controller.WaterPumpSimulation


def test_pid_integral_derivative_and_frequency_limits(monkeypatch):
    clock = iter([0, 1, 2, 3, 4])
    monkeypatch.setattr(
        pid_controller, "time", SimpleNamespace(time=lambda: next(clock))
    )
    pid = PIDController()
    assert pid.compute(10, 0) == pytest.approx(6.5)
    assert pid.compute(10, 5) == pytest.approx(3.75)
    assert pid.compute(10000, 0) == 60
    assert pid.compute(0, 10000) == 0


def test_simulation_pressure_decay_and_lag(monkeypatch):
    pump = WaterPumpSimulation()
    pump.current_pressure = 10
    pump.pid.compute = Mock(return_value=20)
    assert pump.update(12, 0.1) == {"pressure": 9.95, "frequency": 20}
    pump.pid.compute.assert_called_once_with(12, 9.95)
    monkeypatch.setattr(pid_controller.np.random, "normal", lambda *args: 0)
    assert pump.update(12, 0.1) == {"pressure": 9.96, "frequency": 20}


def test_pid_route_loop_preserves_units_frequency_scaling_and_stop(monkeypatch):
    from Services import modbus_routes as runtime

    started = []
    connection = SimpleNamespace(write_register=Mock())
    simulation = SimpleNamespace(
        current_pressure=0,
        current_frequency=0,
        update=Mock(return_value={"frequency": 12.34}),
    )
    monkeypatch.setattr(runtime, "modbus_client", connection)
    monkeypatch.setattr(runtime, "water_pump_sim", simulation)
    monkeypatch.setattr(runtime, "pid_control_active", False)
    monkeypatch.setattr(runtime, "target_pressure", 0)
    monkeypatch.setattr(
        runtime,
        "Thread",
        lambda target: SimpleNamespace(start=lambda: started.append(target)),
    )
    monkeypatch.setattr(
        runtime,
        "time",
        SimpleNamespace(
            sleep=lambda seconds: setattr(runtime, "pid_control_active", False)
        ),
    )

    client = runtime.create_app().test_client()
    assert (
        client.post(
            "/api/modbus/water_pump_pid", json={"target_pressure": 145.038}
        ).status_code
        == 200
    )
    assert runtime.target_pressure == pytest.approx(10)
    started[0]()
    simulation.update.assert_called_once_with(runtime.target_pressure, dt=0.1)
    assert connection.write_register.call_args_list[0].args == (1, 1)
    assert connection.write_register.call_args_list[1].args == (2, 1234)
    assert (
        client.post("/api/modbus/water_pump", json={"state": False}).status_code == 200
    )
    assert connection.write_register.call_args.args == (1, 0)
    assert simulation.current_pressure == 0
    assert simulation.current_frequency == 0
