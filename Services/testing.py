from Services.modbus_service import ModbusConnection
import sys 
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

modbus = ModbusConnection()
modbus.initialize()

#modbus.read_register_holding(0, 7)
modbus.read_register_input(6, [3], 7)