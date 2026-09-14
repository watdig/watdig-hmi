from types import SimpleNamespace

import pytest

from Services.modbus_service import ModbusConnection
from Services.modbus_values import register_value, register_values


class Response:
    def __init__(self, registers, error=False):
        self.registers = registers
        self.error = error

    def isError(self):
        return self.error


def test_register_value_helpers_accept_numbers_lists_and_responses():
    assert register_value(7) == 7
    assert register_value([7, 8]) == 7
    assert register_value(Response([7, 8])) == 7
    assert register_values(Response([7, 8])) == [7, 8]


def test_register_value_helpers_reject_missing_and_error_responses():
    with pytest.raises(ValueError, match="no response"):
        register_value(None)
    with pytest.raises(ValueError, match="Modbus error"):
        register_value(Response([], error=True))


def test_modbus_connection_unwraps_single_and_multiple_reads():
    client = SimpleNamespace(
        read_holding_registers=lambda *args: Response([11, 12]),
        read_input_registers=lambda *args: Response([21, 22]),
    )
    connection = ModbusConnection()
    connection.client = client

    assert connection.read_register_holding(10, 2) == 11
    assert connection.read_register_holding(10, 2, count=2) == [11, 12]
    assert connection.read_register_input(10, 2) == 21
    assert connection.read_register_input(10, 2, count=2) == [21, 22]


def test_modbus_connection_wraps_scalar_writes():
    calls = []
    response = SimpleNamespace(isError=lambda: False, address=10)
    connection = ModbusConnection()
    connection.client = SimpleNamespace(
        write_registers=lambda *args: calls.append(args) or response
    )

    connection.write_register(10, 7, 2)

    assert calls == [(10, [7], 2, False)]
