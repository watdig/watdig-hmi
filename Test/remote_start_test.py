'''import logging
from pymodbus.client import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusException
import time

# Logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Modbus parameters
PORT = "/dev/tty.SLAB_USBtoUART"
BAUDRATE = 9600
PARITY = "N"
STOPBITS = 1
BYTESIZE = 8
UNIT_ID = 1  # Modbus slave ID of the VFD

# Register addresses based on the manual
EXT1_COMMANDS = 1001  # Parameter for Start/Stop by fieldbus
DIRECTION = 1003      # Parameter for Direction by fieldbus
RUN_ENABLE = 1601     # Run enable by fieldbus
START_REGISTER = 1  # Start/stop control register
START_ENABLE = 1608 

def write_register(self, register, value):
        # Method to write a value to a specified Modbus register
        try:
            # Ensure the Modbus client is connected before writing
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Write the specified value to the holding register
            result = self.client.write_register(register, value)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error writing to register {register}")

            # Log successful write operation
            logger.info(f"Successfully wrote value {value} to register {register}")

        except Exception as e:
            # Log any errors that occur during the write operation
            logger.error(f"Error writing to register {register}: {str(e)}")
            raise  # Re-raise 

def main():
    # Initialize Modbus client
    client = ModbusClient(
        port=PORT,
        baudrate=BAUDRATE,
        parity=PARITY,
        stopbits=STOPBITS,
        bytesize=BYTESIZE,
        timeout=3
    )

    if not client.connect():
        logger.error("Failed to connect to VFD")
        return

    logger.info("Successfully connected to the VFD!")

    try:
        # Configure drive for fieldbus control
        client.write_register(1001, 10)
        time.sleep(1)
        client.write_register(1601, 7)
        time.sleep(1)
        client.write_register(103, 30000)
        time.sleep(1)
        client.write_register(1, 0b110)  # Enable EXT1 control
        time.sleep(1)
        client.write_register(1, 0b111)
        time.sleep(1)
        client.write_register(1, 0b1111)
        time.sleep(1)
        client.write_register(1, 0b101111)
        time.sleep(1)
        client.write_register(1, 0b1101111)
        time.sleep(1)
        client.write_register(1, 0b1101111)
        time.sleep(1)

        #client.write_coil(4, True, slave=1)
        print ("wrote!")

        client.write_register(DIRECTION, 3)       # Enable direction control

        # Enable drive
        client.write_register(RUN_ENABLE, 7,)

        # Start the motor (set start command)
        start_command = 0b0001  # Bit 0: Start
        client.write_register(START_REGISTER, start_command)

    except ModbusException as e:
        logger.error(f"Error communicating with VFD: {e}")
    finally:
        client.close()
        logger.info("Connection closed.")

if __name__ == "__main__":
    main()'''

import logging
from pymodbus.client import ModbusSerialClient as ModbusClient
from pymodbus.exceptions import ModbusException
import time

# Logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Modbus connection parameters
MODBUS_PARAMS = {
    "port": "/dev/tty.SLAB_USBtoUART",
    "baudrate": 9600,
    "parity": "N",
    "stopbits": 1,
    "bytesize": 8,
    "timeout": 3,
}

UNIT_ID = 1  # Modbus slave ID of the VFD


# Register addresses
REGISTER_ADDRESSES = {
    "ext1_commands": 1001,
    "direction": 1003,
    "run_enable": 1601,
    "start_register": 1,
}

# Values to write
COMMAND_VALUES = {
    "ext1_control": 10,
    "direction_control": 3,
    "run_enable": 7,
    "start_motor": 0b0001,
}

def write_register_safe(client, register, value, unit_id):
    """Writes a value to a Modbus register with error handling."""
    try:
        result = client.write_register(register, value, unit_id)
        if result.isError():
            raise ModbusException(f"Error writing to register {register}")
        logger.info(f"Successfully wrote value {value} to register {register}")
    except ModbusException as e:
        logger.error(f"Modbus exception: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

def main():
    client = ModbusClient(**MODBUS_PARAMS)

    if not client.connect():
        logger.error("Failed to connect to VFD")
        return

    logger.info("Successfully connected to the VFD!")

    try:
        # Configure drive for fieldbus control
        write_register_safe(client, REGISTER_ADDRESSES["ext1_commands"], COMMAND_VALUES["ext1_control"], UNIT_ID)
        time.sleep(1)
        '''write_register_safe(client, REGISTER_ADDRESSES["run_enable"], COMMAND_VALUES["run_enable"], UNIT_ID)
        time.sleep(8)'''
        write_register_safe(client, REGISTER_ADDRESSES["direction"], COMMAND_VALUES["direction_control"], UNIT_ID)
        time.sleep(1)

        # Start the motor
        write_register_safe(client, REGISTER_ADDRESSES["start_register"], COMMAND_VALUES["start_motor"], UNIT_ID)

    except ModbusException as e:
        logger.error(f"Error communicating with VFD: {e}")
    finally:
        client.close()
        logger.info("Connection closed.")

if __name__ == "__main__":
    main()

