import json
from pathlib import Path

import pytest
from .api_contract import exercise, load_server, manifest

CASES = json.loads(
    (Path(__file__).parent / "fixtures" / "api_contract.json").read_text()
)

MOTOR_RESPONSE_PATHS = {
    "/api/startup-sequence",
    "/api/stop-motor",
    "/api/reverse-motor",
    "/api/wp/startup-sequence",
    "/api/wp/stop-motor",
    "/api/wp/reverse-motor",
}

STANDALONE_SENSOR_PATHS = {
    "/api/bg/motor-temp",
    "/api/bg/earth-preassure",
    "/api/bg/flame",
    "/api/bg/encoder-speed",
    "/api/ag/water-preassure",
}


def is_intentionally_corrected(case):
    """Exclude captured failures that this follow-up explicitly corrects."""
    path = case["path"]
    mode = case["mode"]

    if path in MOTOR_RESPONSE_PATHS or path == "/api/modbus/read":
        return True
    if path == "/write" and case["request"].get("json"):
        return True
    if path == "/read" and mode in {"object", "none"}:
        return True
    if path == "/api/data/mot-therm-stress":
        return True
    if case["server"] == "legacy" and path.startswith("/api/pm"):
        return mode in {"object", "none"}
    if case["server"] == "legacy" and path in {
        "/api/bg/get-thrustTop",
        "/api/bg/encoder-speed",
    }:
        return True
    if case["server"] == "legacy" and path.startswith(("/api/bg/", "/api/ag/")):
        return mode in {"object", "none"}
    if (
        path != "/api/data/operating"
        and path.startswith(("/api/data/", "/api/fault/"))
        and mode in {"object", "none"}
    ):
        return True
    return (
        case["server"] == "standalone"
        and path in STANDALONE_SENSOR_PATHS
        and mode in {"object", "none"}
    )


@pytest.mark.parametrize(
    "case",
    CASES,
    ids=lambda case: f"{case['server']}:{case['method']}:{case['path']}:{case['mode']}:{case['request']}",
)
def test_original_http_and_register_contract(case):
    if is_intentionally_corrected(case):
        pytest.skip("captured failure was intentionally corrected")
    assert exercise(case["server"], case) == case["expected"]


@pytest.mark.parametrize("server", ["standalone", "legacy"])
def test_no_routes_added_or_removed(server):
    _, app = load_server(server)
    expected = {
        (case["path"], case["method"]) for case in CASES if case["server"] == server
    }
    actual = {(path, method) for path, methods in manifest(app) for method in methods}
    assert actual == expected


@pytest.mark.parametrize(
    ("server", "path"),
    [
        ("standalone", "/api/startup-sequence"),
        ("standalone", "/api/stop-motor"),
        ("standalone", "/api/wp/startup-sequence"),
        ("standalone", "/api/wp/stop-motor"),
        ("standalone", "/api/wp/reverse-motor"),
        ("legacy", "/api/startup-sequence"),
        ("legacy", "/api/stop-motor"),
        ("legacy", "/api/reverse-motor"),
    ],
)
def test_motor_write_routes_return_success(server, path):
    result = exercise(
        server,
        {
            "server": server,
            "path": path,
            "method": "GET",
            "mode": "numeric",
            "request": {},
        },
    )

    assert result["status"] == 200
    assert result["body"]["status"] == "success"
    assert any(call[0] == "write" for call in result["calls"])


def test_standalone_write_accepts_frontend_json_body():
    result = exercise(
        "standalone",
        {
            "server": "standalone",
            "path": "/write",
            "method": "POST",
            "mode": "numeric",
            "request": {"json": {"unitId": 2, "register": 10, "value": 7}},
        },
    )

    assert result["status"] == 200
    assert result["body"] == {
        "message": "Write successful",
        "register": 10,
        "value": 7,
    }
    assert result["calls"] == [["write", [10, [7], 2]]]


@pytest.mark.parametrize("server", ["standalone", "legacy"])
def test_telemetry_accepts_modbus_response_objects(server):
    result = exercise(
        server,
        {
            "server": server,
            "path": "/api/data/output-frequency",
            "method": "GET",
            "mode": "object",
            "request": {},
        },
    )

    assert result["status"] == 200
    assert result["body"] == {"Output Frequency": {"value": 65.0, "unit": "Hz"}}


def test_standalone_sensor_accepts_modbus_response_object():
    result = exercise(
        "standalone",
        {
            "server": "standalone",
            "path": "/api/bg/earth-preassure",
            "method": "GET",
            "mode": "object",
            "request": {},
        },
    )

    assert result["status"] == 200
    assert result["body"] == 650


def test_legacy_sensor_accepts_modbus_response_object():
    result = exercise(
        "legacy",
        {
            "server": "legacy",
            "path": "/api/bg/get-thrustTop",
            "method": "GET",
            "mode": "object",
            "request": {},
        },
    )

    assert result["status"] == 200
    assert result["body"] == 650


def test_legacy_power_meter_accepts_modbus_response_objects():
    result = exercise(
        "legacy",
        {
            "server": "legacy",
            "path": "/api/pm480/V1N",
            "method": "GET",
            "mode": "object",
            "request": {},
        },
    )

    assert result["status"] == 200
    assert result["calls"] == [["input", [8, 3]], ["input", [9, 3]]]
