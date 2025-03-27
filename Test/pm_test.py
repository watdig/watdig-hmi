from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
import sqlite3
import struct
from flask_cors import CORS

CORS()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModbusConnection:
    def __init__(self, port='/dev/tty.SLAB_USBtoUART', baudrate=115200, timeout=5):
        # Initialize the Modbus connection parameters
        self.port = port  # Serial port to connect to
        self.baudrate = baudrate  # Baud rate for the connection
        self.timeout = timeout  # Timeout for the connection
        self.client = None  # Placeholder for the Modbus client
        self.connect()  # Attempt to connect to the Modbus device upon initialization

    def connect(self):
        # Method to establish a connection to the Modbus device
        retry_count = 0  # Counter for connection attempts
        max_retries = 3  # Maximum number of retries for connection

        while retry_count < max_retries:
            try:
                # Check if the client is already connected and close it if so
                if self.client and self.client.is_socket_open():
                    self.client.close()

                # Initialize the Modbus client with the specified parameters
                self.client = ModbusClient(
                    port=self.port,
                    baudrate=self.baudrate,
                    timeout=self.timeout
                )

                # Attempt to connect to the Modbus device
                if self.client.connect():
                    logger.info(f"Successfully connected to Modbus device on {self.port}")
                    return True  # Return True if connection is successful
                else:
                    # Raise an exception if the connection fails
                    raise serial.serialutil.SerialException(f"Failed to open port {self.port}")

            except serial.serialutil.SerialException as e:
                # Handle specific serial exceptions
                if "Resource temporarily unavailable" in str(e):
                    logger.warning(f"Port {self.port} is temporarily unavailable, retrying...")
                else:
                    logger.error(f"Serial exception on connection attempt {retry_count + 1}: {str(e)}")

                retry_count += 1  # Increment the retry count
                time.sleep(1)  # Wait for a second before retrying

            except Exception as e:
                # Handle any other exceptions that may occur
                logger.error(f"Connection attempt {retry_count + 1} failed: {str(e)}")
                retry_count += 1  # Increment the retry count
                time.sleep(1)  # Wait before the next retry

        logger.error("Failed to connect after maximum retries")  # Log failure after max retries
        return False  # Return False if connection fails after retries
    
    def read_register_holding(self, register, unitID):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Read the specified holding register
            result = self.client.read_holding_registers(register, 1, unitID)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error reading register {register}")

            # Return the first value from the result (register value)
            return result.registers[0]

        except Exception as e:
            # Log any errors that occur during the read operation
            logger.error(f"Error reading register {register}: {str(e)}")
            raise  # Re-raise the exception for further handling

    def read_register_input(self, register, unitID):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Read the specified holding register
            result = self.client.read_input_registers(register, 1, unitID)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error reading register {register}")

            # Return the first value from the result (register value)
            return result.registers[0]

        except Exception as e:
            # Log any errors that occur during the read operation
            logger.error(f"Error reading register {register}: {str(e)}")
            raise  # Re-raise the exception for further handling
    
    def write_register(self, register, value, unitID):
        # Method to write a value to a specified Modbus register
        try:
            # Ensure the Modbus client is connected before writing
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Write the specified value to the holding register
            result = self.client.write_register(register, value, unitID)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error writing to register {register}")

            # Log successful write operation
            logger.info(f"Successfully wrote value {value} to register {register}")

        except Exception as e:
            # Log any errors that occur during the write operation
            logger.error(f"Error writing to register {register}: {str(e)}")
            raise  # Re-raise the exception

modbus = ModbusConnection()
def test_startup_sequence():
    '''modbus.write_register(0, 0)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    modbus.write_register(0, 0b110)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    time.sleep(0.1)
    modbus.write_register(0, 0b111)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    modbus.write_register(0, 0b1111)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    modbus.write_register(0, 0b101111)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    modbus.write_register(0, 0b1101111)
    modbus.write_register(1, 20000)
    time.sleep(4)
    modbus.write_register(0, 0)
    while modbus.read_register(0) == 0b1101111:
        modbus.read_register(0)
        time.sleep(0.5)'''

#control power voltage (120 and 480)
# Register 0: Voltage V1N
# Register 2: Voltage V2N
# Register 4: Voltage V3N
# Register 16: Voltage I1
# Register 18: Voltage I2
def read_power_meter(val, slave):
    x = (modbus.read_register_input(val, slave) & 0xFFFF)  # Lower 16 bits
    y = (modbus.read_register_input(val + 1, slave) & 0xFFFF) << 16  # Upper 16 bits

    # Combine the registers into a single 32-bit integer
    z = x + y  # Assumes little-endian order (low register first)

    # Convert the 32-bit integer to a floating-point value
    float_value = struct.unpack('<f', struct.pack('<I', z))[0]  # '<' indicates little-endian

    print(float_value)
    binary_representation = format(z, '032b')  # Format the 32-bit integer as a binary string

    # Print the binary representation
    print("Binary representation:", binary_representation)

    
    
    '''print("Binary representation of float_value:", ''.join(f'{byte:08b}' for byte in struct.pack('f', float_value)))
    print(float_value)

    print(bin(modbus.read_register(0)))
    print(bin(modbus.read_register(9)))'''

#Does not work 
def read_power_meter_alt(val, slave):
    x = (modbus.read_register_input(val, slave) & 0xFFFF)  # Lower 16 bits
    y = (modbus.read_register_input(val + 1, slave) & 0xFFFF) << 16  # Upper 16 bits

    # Combine the registers into a single 32-bit integer
    z = x + y  # Assumes little-endian order (low register first)

    # Convert the 32-bit integer to a floating-point value
    float_value = struct.unpack('<f', struct.pack('<I', z))[0]  # '<' indicates little-endian

    print(float_value)
    binary_representation = format(z, '032b')  # Format the 32-bit integer as a binary string

    # Print the binary representation
    print("Binary representation:", binary_representation)

    
    
    '''print("Binary representation of float_value:", ''.join(f'{byte:08b}' for byte in struct.pack('f', float_value)))
    print(float_value)

    print(bin(modbus.read_register(0)))
    print(bin(modbus.read_register(9)))'''



if __name__ == '__main__':
    # Start Flask app
    #app.run(use_reloader=False, host='0.0.0.0', port=8080)
    '''modbus.write_register(0, 0b110, 2)
    time.sleep(0.1)
    modbus.write_register(0, 0b111, 2)
    modbus.write_register(0, 0b1111, 2)
    modbus.write_register(0, 0b101111, 2)
    modbus.write_register(0, 0b1101111, 2)
    while True:
        modbus.write_register(1, 20000, 2)
        time.sleep(0.1)'''
    modbus.read_register_holding(0, 7)
    #read_power_meter(18, 4)
    #read_power_meter(0, 3)
    #print(modbus.read_register_input(100, 2))
    #test_power_meter(2, 4)
    #test_power_meter(4, 4)
    '''print(test_power_meter(2))
    print(test_power_meter(4))'''