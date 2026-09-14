import runpy
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

from flask import Flask


def test_standalone_script_keeps_its_listen_settings(monkeypatch):
    from Services import logger_service
    from Services.modbus_service import ModbusConnection

    run = Mock()
    monkeypatch.setattr(Flask, "run", run)
    monkeypatch.setattr(ModbusConnection, "initialize", lambda self: None)
    monkeypatch.setattr(logger_service, "info", lambda *args: None)
    path = Path(__file__).resolve().parents[1] / "Services" / "modbus_routes.py"
    namespace = runpy.run_path(str(path), run_name="__main__")
    run.assert_called_once_with(host="127.0.0.1", port=5000, debug=False, threaded=True)
    assert "/read" in {rule.rule for rule in namespace["app"].url_map.iter_rules()}


def test_legacy_retry_and_cleanup_policy(monkeypatch):
    from Services.CritSrvs import server

    connection = SimpleNamespace(client=SimpleNamespace(close=Mock()))
    factory = Mock(
        side_effect=[
            RuntimeError("unavailable"),
            RuntimeError("unavailable"),
            connection,
        ]
    )
    sleep = Mock()
    run = Mock()
    monkeypatch.setattr(server, "modbus", None)
    monkeypatch.setattr(server, "rs485_connected", False)
    monkeypatch.setattr(server, "ModbusConnection", factory)
    monkeypatch.setattr(server, "time", SimpleNamespace(sleep=sleep))
    monkeypatch.setattr(server, "info", lambda *args: None)
    monkeypatch.setattr(server, "error", lambda *args: None)
    monkeypatch.setattr(server.app, "run", run)

    server.run_server()

    assert factory.call_count == 3
    assert [call.args for call in sleep.call_args_list] == [(2,), (2,)]
    assert server.rs485_connected is True
    run.assert_called_once_with(use_reloader=False, host="0.0.0.0", port=8080)
    connection.client.close.assert_called_once_with()
