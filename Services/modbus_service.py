from flask import Flask, jsonify, request
from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
from functools import wraps
import time
import sys
import glob
import serial
from Services.database_service import Database
import sqlite3
from flask_cors import CORS
import threading
from Services.logger_service import info, error, warning, debug, critical

class ModbusConnection:
    def __init__(self, port='/dev/tty.SLAB_USBtoUART', baudrate=9600, timeout=5):
        self.port = port 
        self.baudrate = baudrate
        self.timeout = timeout
        self.client = None
        self.connect()

    def connect(self):
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                if self.client and self.client.is_socket_open():
                    self.client.close()

                self.client = ModbusClient(
                    port=self.port,
                    baudrate=self.baudrate,
                    timeout=self.timeout
                )

                if self.client.connect():
                    info(f"Successfully connected to Modbus device on {self.port}")
                    return True
                else:
                    raise serial.serialutil.SerialException(f"Failed to open port {self.port}")

            except serial.serialutil.SerialException as e:
                # Handle specific serial exceptions
                if "Resource temporarily unavailable" in str(e):
                    warning(f"Port {self.port} is temporarily unavailable, retrying...")
                else:
                    error(f"Serial exception on connection attempt {retry_count + 1}: {str(e)}")
                    
                retry_count += 1
                time.sleep(1)

            except Exception as e:
                error(f"Connection attempt {retry_count + 1} failed: {str(e)}")
                retry_count += 1
                time.sleep(1)
                
        error("Failed to connect after maximum retries")
        return False

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
            #logger.info(f"Successfully wrote value {value} to register {register}")

        except Exception as e:
            # Log any errors that occur during the write operation
            #logger.error(f"Error writing to register {register}: {str(e)}")
            raise

    def write_register(self, register: int, value: int, slaveID: int):
        try:
            if not self.client or not self.client.is_socket_open():
                if not self.connect():
                    raise Exception("Failed to reconnect to Modbus device")

            result = self.client.write_register(register, value, slaveID)

            if result.isError():
                raise Exception(f"Modbus error writing to register {register}")

            info(f"Successfully wrote value {value} to register {register}")

        except Exception as e:
            error(f"Error writing to register {register}: {str(e)}")
            raise