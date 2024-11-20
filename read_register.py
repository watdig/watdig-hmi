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
        result = client.read_holding_registers(0, 10, UNIT_ID)
        #result = client.execute(ModbusClient.report_slave_id(1))
        
        if result.isError():
            print(f"Error message: {result._request}");
            '''logger.error(f"Error reading register {register}: {result}")'''
        else:
            print("Reading register values:", result.registers)
            '''value = result.registers[0]
            logger.info(f"Register {register} value: {value}")
            return value'''
        
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
        timeout=5
    )
    if client.connect():
        logger.info("Successfully connected to the VFD!")

        '''result = client.write_register(0x9802, 1, UNIT_ID)

        if result.isError():
            logger.error(f"Error writing register 0x9802")
        else:
            logger.info(f"Success")'''
        
        # Registers to read
        registers_to_check = [102, 1002, 1003, 1102, 1103, 1106]

        # Read each register and print the result
        for register in registers_to_check:
            read_register(client, register)

        client.close()
    else:
        logger.error("Failed to connect to the VFD.")

if __name__ == "__main__":
    read_register(1)
