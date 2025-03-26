from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
import sqlite3
from flask_cors import CORS

CORS()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModbusConnection:
    def __init__(self, port='/dev/tty.SLAB_USBtoUART', baudrate=9600, timeout=5):
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
        
        # Enable socket logging
        import pymodbus.transaction
        pymodbus.transaction.SOCKET_LOGGER = True
        
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

    def read_register(self, register, unitId, count=1):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")
        
            logging.debug(f"Sending Modbus request: register={register}, count={count}, unit={unitId}")
            
            # Read the specified holding register
            start_time = time.time()
            result = self.client.read_holding_registers(register, count, unitId)
            response_time = time.time() - start_time
            
            logging.debug(f"Modbus response time: {response_time:.3f}s")
            logging.debug(f"Raw response: {result}")
            
            # Check for errors in the result
            if result.isError():
                error_code = getattr(result, 'exception_code', 'unknown')
                logging.error(f"Modbus error code: {error_code}")
                raise Exception(f"Modbus error reading register {register}, error code: {error_code}")
            
            logging.info(f"Successfully read register {register}, value: {result.registers}")
            # Return the first value from the result (register value)
            return result.registers[0] if count == 1 else result.registers

        except Exception as e:
            logging.error(f"Error reading register {register}: {str(e)}", exc_info=True)
            raise
    
    def read_register_pm(self, register, unitId, count=1):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")
        
            logging.debug(f"Sending Modbus request: register={register}, count={count}, unit={unitId}")
            
            # Read the specified holding register
            start_time = time.time()
            result = self.client.read_input_registers(register, count, unitId)
            response_time = time.time() - start_time
            
            logging.debug(f"Modbus response time: {response_time:.3f}s")
            logging.debug(f"Raw response: {result}")
            
            # Check for errors in the result
            if result.isError():
                error_code = getattr(result, 'exception_code', 'unknown')
                logging.error(f"Modbus error code: {error_code}")
                raise Exception(f"Modbus error reading register {register}, error code: {error_code}")
            
            logging.info(f"Successfully read register {register}, value: {result.registers}")
            # Return the first value from the result (register value)
            return result.registers[0] if count == 1 else result.registers

        except Exception as e:
            logging.error(f"Error reading register {register}: {str(e)}", exc_info=True)
            raise

    def write_register(self, register, value, deviceId):
        # Method to write a value to a specified Modbus register
        try:
            # Ensure the Modbus client is connected before writing
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Write the specified value to the holding register
            result = self.client.write_register(address=register, value=value, slave=deviceId)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error writing to register {register}")

            # Log successful write operation
            logger.info(f"Successfully wrote value {value} to register {register}")

        except Exception as e:
            # Log any errors that occur during the write operation
            logger.error(f"Error writing to register {register}: {str(e)}")
            raise  # Re-raise the exception
    
    def test_power_meter(val, slave):
        x = (modbus.read_register_pm(val, slave) & 0xFFFF)  # Lower 16 bits
        y = (modbus.read_register_pm(val + 1, slave) & 0xFFFF) << 16  # Upper 16 bits

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

modbus = ModbusConnection()
'''modbus.write_register(0, 0b110, 1)
time.sleep(0.1)
modbus.write_register(0, 0b111, 1)
modbus.write_register(0, 0b1111, 1)
modbus.write_register(0, 0b101111, 1)
modbus.write_register(0, 0b1101111, 1)
while True:
    modbus.write_register(1, 10000, 1)
    time.sleep(0.1)'''
modbus.read_register(8, 3, 2)