"""Convert pymodbus response objects into application-level values."""


def register_values(result):
    """Return register values from a scalar, sequence, or pymodbus response."""
    if result is None:
        raise ValueError("Modbus returned no response")
    if hasattr(result, "isError") and result.isError():
        raise ValueError(f"Modbus error: {result}")

    values = result.registers if hasattr(result, "registers") else result
    if isinstance(values, (list, tuple)):
        if not values:
            raise ValueError("Modbus returned no registers")
        return list(values)
    if isinstance(values, (int, float)):
        return [values]
    raise TypeError(f"Unsupported Modbus response: {type(result).__name__}")


def register_value(result):
    """Return the first numeric register value."""
    return register_values(result)[0]
