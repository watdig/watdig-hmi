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

# Motor Speed Control Parameters
MOT_NOM_SPEED = 1000  # Nominal motor speed (in RPM)
MOT_NOM_FREQ = 60   # Nominal motor frequency (in Hz)

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

def configure_vfd(client):
    try:
        # Set serial communication protocol to Modbus (parameter 9802)
        serial_comm_protocol = 4  # 1 for Standard Modbus
        client.write_register(9802, serial_comm_protocol, UNIT_ID)  # Modbus register 9802
        logger.info("Serial communication set to Modbus.")

        # Set EXT1 commands for start/stop control (parameter 1001)
        ext1_command_value = 10  # Value for COMM (fieldbus control)
        client.write_register(1001, ext1_command_value, UNIT_ID)  # Modbus register 1001
        logger.info("EXT1 command set for start/stop control.")

        # Set EXT2 commands for start/stop control (parameter 1002)
        ext2_command_value = 10  # Value for COMM (fieldbus control)
        client.write_register(1002, ext2_command_value, UNIT_ID)  # Modbus register 1002
        logger.info("EXT2 command set for start/stop control.")

        # Set direction control (parameter 1003)
        direction_request_value = 3  # Value for REQUEST (fieldbus control)
        client.write_register(1003, direction_request_value, UNIT_ID)  # Modbus register 1003
        logger.info("Direction control set for fieldbus.")

        # Set input reference selection EXT1/EXT2 (parameter 1102)
        ref_select_value = 8  # 8 for COMM (fieldbus input reference)
        client.write_register(1102, ref_select_value, UNIT_ID)  # Modbus register 1102
        logger.info("Input reference EXT1/EXT2 selected for fieldbus.")

        # Set REF1 selection for fieldbus input (parameter 1103)
        ref1_select_value = 8  # 8 for COMM (fieldbus input reference)
        client.write_register(1103, ref1_select_value, UNIT_ID)  # Modbus register 1103
        logger.info("REF1 input reference set for fieldbus.")

        # Set REF2 selection for fieldbus input (parameter 1106)
        ref2_select_value = 8  # 8 for COMM (fieldbus input reference)
        client.write_register(1106, ref2_select_value, UNIT_ID)  # Modbus register 1106
        logger.info("REF2 input reference set for fieldbus.")
        
    except Exception as e:
        logger.error(f"Error configuring VFD parameters: {e}")

def connect_to_vfd():
    client = ModbusClient(
        port=PORT,
        baudrate=BAUDRATE,
        parity=PARITY,
        stopbits=1,
        bytesize=8,
        timeout=1
    )

    if client.connect():
        logger.info("Successfully connected to the VFD!")
        configure_vfd(client)  # Set drive parameters before starting
    else:
        logger.error("Failed to connect to the VFD.")
    
    client.close()

'''if __name__ == "__main__":
    connect_to_vfd()'''


def start_motor(client):
        # Enable "run enable by fieldbus" (bit 3 of register 40001)
    RUN_ENABLE_FIELD_BUS = 0b00001000  # Bit 3 set to 1 (binary 1000)
    client.write_register(40001, RUN_ENABLE_FIELD_BUS, UNIT_ID)
        
        # Enable "start enable" (bit 2 of register 40032) for Start Enable 1
    START_ENABLE_1 = 0b00000100  # Bit 2 set to 1 (binary 100)
    client.write_register(40032, START_ENABLE_1, UNIT_ID)
        
        # Enable "start enable" (bit 3 of register 40032) for Start Enable 2
    START_ENABLE_2 = 0b00001000  # Bit 3 set to 1 (binary 1000)
    client.write_register(40032, START_ENABLE_2, UNIT_ID)



def set_motor_speed(client, speed_rpm):
    """
    Set motor speed by writing to the appropriate frequency register.
    """
        # For example, if you need to set the speed based on frequency:
    speed_register = 40103  # FREQ OUTPUT register (frequency in Hz)
        
        # Convert RPM to frequency (this will depend on your system)
        # For example: 1 RPM = 1 Hz (simple case, adjust for your system)
    frequency_hz = MOT_NOM_FREQ  # Assuming 1 RPM = 1 Hz, adjust if needed
        
        # Write to frequency output register
    client.write_register(speed_register, frequency_hz)


def connect_to_vfd():
    client = ModbusClient(
        port=PORT,
        baudrate=BAUDRATE,
        parity=PARITY,
        stopbits=1,
        bytesize=8,
        timeout=1
    )

    if client.connect():
        logger.info("Successfully connected to the VFD!")
        configure_vfd(client)  # Set drive parameters before starting
        start_motor(client)
        
        # Set motor speed to 1500 RPM (example)
        set_motor_speed(client, 1500)
    else:
        logger.error("Failed to connect to the VFD.")
    
    client.close()

if __name__ == "__main__":
    connect_to_vfd()
    start_motor(client = ModbusClient(
        port=PORT,
        baudrate=BAUDRATE,
        parity=PARITY,
        stopbits=1,
        bytesize=8,
        timeout=1
    ))
