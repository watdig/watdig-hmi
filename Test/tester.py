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

    def write_register(self, register, value, deviceId):
        # Method to write a value to a specified Modbus register
        try:
            # Ensure the Modbus client is connected before writing
            if not self.client or not self.client.is_socket_open():
                if not self.connect():  # Attempt to reconnect if not connected
                    raise Exception("Failed to reconnect to Modbus device")

            # Write the specified value to the holding register
            result = self.client.write_register(register, value, deviceId)

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
value = modbus.read_register(65, 5)
print(value)