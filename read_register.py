from pymodbus.client import ModbusSerialClient as ModbusClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection parameters
PORT = '/dev/tty.SLAB_USBtoUART'
BAUDRATE = 9600
PARITY = 'N'
UNIT_ID = 1

def read_register(client, register):
    try:
        # Read the register value synchronously
        result = client.read_holding_registers(register, 1, UNIT_ID)
        
        if result.isError():
            logger.error(f"Error reading register {register}: {result}")
        else:
            value = result.registers[0]
            logger.info(f"Register {register} value: {value}")
            return value
    except Exception as e:
        logger.error(f"Error reading register {register}: {e}")
        return None

def check_vfd_registers():
    client = ModbusClient(
        port=PORT,
        baudrate=BAUDRATE,
        parity=PARITY,
        stopbits=1,
        bytesize=8,
        timeout=3
    )

    if client.connect():
        logger.info("Successfully connected to the VFD!")

        result = client.write_register(0x9802, 1, UNIT_ID)

        if result.isError():
            logger.error(f"Error writing register 0x9802")
        else:
            value = result.registers[0]
            logger.info(f"Success")
        
        # Registers to read
        registers_to_check = [0x1001, 0x1002, 0x1003, 0x1102, 0x1103, 0x1106]
        ''',0x40102'''

        # Read each register and print the result
        for register in registers_to_check:
            read_register(client, register)

        client.close()
    else:
        logger.error("Failed to connect to the VFD.")

if __name__ == "__main__":
    check_vfd_registers()
