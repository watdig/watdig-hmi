"""Fail immediately if an offline regression test attempts real device access."""

import socket

import pytest
import serial
from pymodbus.client import ModbusSerialClient


@pytest.fixture(autouse=True)
def prohibit_device_access(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError(
            "Offline tests must not connect to hardware or the network"
        )

    monkeypatch.setattr(serial.Serial, "open", forbidden)
    monkeypatch.setattr(ModbusSerialClient, "connect", forbidden)
    monkeypatch.setattr(socket.socket, "connect", forbidden)
    monkeypatch.setattr(socket, "create_connection", forbidden)
