from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from database import Database
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

    def read_register(self, register):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Read the specified holding register
            result = self.client.read_holding_registers(register, 1)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error reading register {register}")

            # Return the first value from the result (register value)
            return result.registers[0]

        except Exception as e:
            # Log any errors that occur during the read operation
            logger.error(f"Error reading register {register}: {str(e)}")
            raise  # Re-raise the exception for further handling

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
            raise  # Re-raise the exception
from flask import Flask, jsonify
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from database import Database
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

    def read_register(self, register):
        # Method to read a value from a specified Modbus register
        try:
            # Ensure the Modbus client is connected before reading
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Read the specified holding register
            result = self.client.read_holding_registers(register, 1)

            # Check for errors in the result
            if result.isError():
                raise Exception(f"Modbus error reading register {register}")

            # Return the first value from the result (register value)
            return result.registers[0]

        except Exception as e:
            # Log any errors that occur during the read operation
            logger.error(f"Error reading register {register}: {str(e)}")
            raise  # Re-raise the exception for further handling

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
            raise  # Re-raise the exception

modbus = ModbusConnection()
def test_startup_sequence():
    '''modbus.write_register(1, 20000)
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
    modbus.write_register(0, 0b1101111)'''
    modbus.write_register(1, 20000)
    #print(bin(modbus.read_register(3)))
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    #time.sleep(5)
    #print(f"Register value (binary): {bin(modbus.read_register(3))}")
    '''print(f"Register value (binary): {bin(modbus.read_register(0))}")
    time.sleep(1)
    print(f"Register value (binary): {bin(modbus.read_register(5318))}")

    print(f"Register value (binary): {bin(modbus.read_register(3))}")
    time.sleep(1)
    print(f"Register value (binary): {bin(modbus.read_register(5319))}")'''

if __name__ == '__main__':
    # Start Flask app
    #app.run(use_reloader=False, host='0.0.0.0', port=8080)
    #startup_sequence()
    while True:
        test_startup_sequence()