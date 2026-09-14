"""Exercise HTTP contracts with recorded I/O, never a physical controller."""

import contextlib
import importlib
import io
import json
import logging
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

MODULES = {"standalone": "Services.modbus_routes", "legacy": "Services.CritSrvs.server"}


class RegisterValue(int):
    registers = [650, 0]

    def isError(self):
        return False


class RegisterResponse:
    registers = [650, 0]

    def isError(self):
        return False

    def __str__(self):
        return "RegisterResponse(650, 0)"


def load_server(name):
    module = importlib.import_module(MODULES[name])
    app = module.create_app() if name == "standalone" else module.app
    app.config.update(TESTING=False, PROPAGATE_EXCEPTIONS=False)
    app.logger.disabled = True
    return module, app


def manifest(app):
    return sorted(
        (rule.rule, sorted(rule.methods - {"HEAD", "OPTIONS"}))
        for rule in app.url_map.iter_rules()
        if rule.endpoint != "static"
    )


def exercise(name, case):
    module, app = load_server(name)
    calls = []
    mode = case["mode"]

    def read(method, *args):
        calls.append([method, list(args)])
        if mode == "failure":
            raise RuntimeError("test transport failure")
        if mode == "none":
            return None
        return RegisterResponse() if mode == "object" else RegisterValue(650)

    def write(*args):
        calls.append(["write", list(args)])
        if mode == "failure":
            raise RuntimeError("test transport failure")

    connection = SimpleNamespace(
        client=SimpleNamespace(
            is_socket_open=lambda: mode != "disconnected", close=lambda: None
        ),
        read_register_holding=lambda *args: read("holding", *args),
        read_register_input=lambda *args: read("input", *args),
        write_register=write,
    )
    with pytest.MonkeyPatch.context() as patch, contextlib.redirect_stdout(
        io.StringIO()
    ):
        patch.setattr(
            module, "modbus_client" if name == "standalone" else "modbus", connection
        )
        patch.setattr(module, "info", lambda *args: None)
        patch.setattr(module, "error", lambda *args: None)
        patch.setattr(
            module,
            "time",
            SimpleNamespace(sleep=lambda seconds: calls.append(["sleep", [seconds]])),
        )
        patch.setattr(
            module,
            "db",
            SimpleNamespace(
                get_recent_operating_data=lambda: [
                    SimpleNamespace(to_dict=lambda: {"speed_rpm": 650})
                ]
            ),
        )
        if name == "standalone":
            patch.setattr(
                module,
                "Thread",
                lambda **kwargs: SimpleNamespace(
                    start=lambda: calls.append(["thread", []])
                ),
            )
            patch.setattr(
                module,
                "water_pump_sim",
                SimpleNamespace(current_pressure=12, current_frequency=30),
            )
            patch.setattr(module, "pid_control_active", False)
            patch.setattr(module, "target_pressure", 0)
        else:
            patch.setattr(module, "rs485_connected", mode != "disconnected")
        response = app.test_client().open(
            case["path"], method=case["method"], **case["request"]
        )
        body = (
            response.get_json() if response.is_json else response.get_data(as_text=True)
        )
        result = {"status": response.status_code, "body": body, "calls": calls}
        if name == "standalone":
            result["pid"] = [
                module.pid_control_active,
                module.target_pressure,
                module.water_pump_sim.current_pressure,
                module.water_pump_sim.current_frequency,
            ]
        return result


def capture():
    """Print contracts before refactoring; reviewing changes to fixtures is required."""
    records = []
    for name in MODULES:
        _, app = load_server(name)
        for path, methods in manifest(app):
            for method in methods:
                payloads = (
                    [
                        {
                            "query_string": {
                                "unitId": 2,
                                "register": 10,
                                "range": 1,
                                "value": 7,
                            }
                        }
                    ]
                    if method == "GET"
                    else [
                        {
                            "json": {
                                "unitId": 2,
                                "register": 10,
                                "value": 7,
                                "frequency": 1234,
                                "target_pressure": 145.038,
                                "state": True,
                            }
                        },
                        {"json": {}},
                    ]
                )
                if "frequency" in path and method == "POST":
                    payloads += [
                        {"json": {"frequency": value}}
                        for value in [-20000, 20000, -20001, 20001, "bad", "-23"]
                    ]
                if path in ("/read", "/api/modbus/read"):
                    payloads += [
                        {"query_string": {"unitId": 2, "register": 10, "range": size}}
                        for size in [0, 3, 101]
                    ] + [{}]
                if path == "/write":
                    payloads += [
                        {"query_string": {"unitId": 2, "register": 10, "value": 7}}
                    ]
                if path == "/api/modbus/water_pump":
                    payloads += [{"json": {"state": False}}]
                for mode in ["numeric", "object", "failure", "none", "disconnected"]:
                    for payload in payloads:
                        case = {
                            "server": name,
                            "path": path,
                            "method": method,
                            "mode": mode,
                            "request": payload,
                        }
                        case["expected"] = exercise(name, case)
                        records.append(case)
    return records


if __name__ == "__main__":
    logging.disable(logging.CRITICAL)
    print(json.dumps(capture()))
