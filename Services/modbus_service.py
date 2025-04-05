from pymodbus.client import ModbusSerialClient as ModbusClient
import logging
import time
import sys

class ModbusConnection:
    def __init__(self, 
            port='/dev/tty.usbserial-0001', 
            baudrate=9600, 
            parity='N', 
            unit_id=1, 
            stopbits=1, 
            bytesize=8, 
            timeout=2):
        # Set up logging
        logging.basicConfig()
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.ERROR) 
        logging.getLogger('pymodbus').setLevel(logging.ERROR)

        # Connection parameters
        self.PORT = port
        self.BAUDRATE = baudrate
        self.PARITY = parity
        self.UNIT_ID = unit_id
        self.STOPBITS = stopbits
        self.BYTESIZE = bytesize
        self.TIMEOUT = timeout

        self.client = None

    def initialize(self):
        self.client = ModbusClient(
            port=self.PORT,
            baudrate=self.BAUDRATE,
            parity=self.PARITY,
            stopbits=self.STOPBITS,
            bytesize=self.BYTESIZE,
            timeout=self.TIMEOUT,
        )
        return self.client

    def read_register_holding(self, register: int, modbus_id=None):
        if modbus_id is None:
            modbus_id = self.UNIT_ID

        try:
            # Read the register value synchronously
            result = self.client.read_holding_registers(register, 1, modbus_id)
            
            if result.isError():
                print(f"Error message: {result}")
                return result
            
            print("Returned values:", result.registers)
            return result
            
        except Exception as e:
            self.logger.error(f"Error reading register {register}: {e}")
            return None
    
    def read_register_input(self, address, count, slave=1):
        """
        Read input registers and properly handle errors
        """
        try:
            result = self.client.read_input_registers(address, count, slave)
            
            # Check if result is an integer (error code) or has an isError method
            if isinstance(result, int):
                raise Exception(f"Received error code: {result}")
            elif hasattr(result, 'isError') and result.isError():
                raise Exception(f"Modbus error: {result}")
            
            return result
        except Exception as e:
            # Log the error and re-raise it for the route handler to catch
            self.logger.error(f"Error reading input register {address}: {e}")
            raise
            
    def write_register(self, register: int, values: list, modbus_id=None):
        if modbus_id is None:
            modbus_id = self.UNIT_ID

        try:
            # Write the register value synchronously
            result = self.client.write_registers(register, values, modbus_id, False)
            
            if result.isError():
                print(f"Error message: {result}")
                return result
            
            print(f"Writing register values {values} to address {result.address}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error writing register {register}: {e}")
            return None

    def connect(self):
        return self.client.connect() if self.client else False

    def close(self):
        if self.client:
            self.client.close()

    def interactive_mode(self):
        if not self.client or not self.client.connect():
            print("Could not establish Modbus connection")
            return

        '''while True:
            print("Enter numbers separated by spaces, enter q to terminate program")
            user_input = input("Format: Read(0)/Write(1) | # Registers | Start Register | Data:")
            if user_input == "q":
                break
            
            try:
                command = list(map(int, user_input.split()))
                if len(command) < 3:
                    print("Not Enough inputs")
                elif command[0] > 1:
                    print("Read/Write input invalid")
                else:
                    if command[0] == 0:
                        response = self.read_register(command[2], command[1], self.UNIT_ID)
                    else:
                        data = []
                        for i in range(3, command[1] + 3):
                            data.append(command[i])
                            print(data)
                        response = self.write_register(command[2], data, self.UNIT_ID)
            except ValueError:
                print("Invalid input. Please enter numeric values.")

        self.close()'''

# Example usage
'''if __name__ == "__main__":
    modbus_handler = ModbusConnection()
    modbus_handler.initialize()
    modbus_handler.interactive_mode()'''