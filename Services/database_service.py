import sqlite3
from datetime import datetime
from tabulate import tabulate
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from Models.ModbusDB.operating_data_table import Base, OperatingData
from Models.ModbusDB.operating_data_water_pump import Base, OperatingDataWaterPump

class Database:
    def __init__(self, db_file="modbus_logs.db"):
        self.db_file = f"sqlite:///{db_file}"
        self.engine = create_engine(self.db_file)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    def init_database(self):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()

        # Check if operating_data table exists before creating it
        cursor.execute('''
            SELECT count(name) FROM sqlite_master 
            WHERE type='table' AND name='operating_data'
        ''')

        # If the table doesn't exist, create it
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                CREATE TABLE operating_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    speed_rpm REAL,
                    output_frequency REAL,
                    current_amps REAL,
                    torque_percent REAL,
                    power_kw REAL,
                    dc_bus_voltage REAL,
                    output_voltage REAL,
                    drive_temp_c REAL,
                    drive_cb_temp_c REAL,
                    motor_thermal_stress_percent REAL,
                    latest_fault TEXT,
                    speed_at_fault REAL,
                    frequency_at_fault REAL,
                    voltage_at_fault REAL,
                    current_at_fault REAL,
                    torque_at_fault REAL,
                    status_at_fault TEXT
                )
            ''')
            print("Created operating_data table")
        else:
            print("Table operating_data already exists")

        # Check if operating_data_water_pump table exists before creating it
        cursor.execute('''
            SELECT count(name) FROM sqlite_master 
            WHERE type='table' AND name='operating_data_water_pump'
        ''')

        # If the water pump table doesn't exist, create it
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                CREATE TABLE operating_data_water_pump (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    speed_rpm REAL,
                    output_frequency REAL,
                    current_amps REAL,
                    torque_percent REAL,
                    power_kw REAL,
                    dc_bus_voltage REAL,
                    output_voltage REAL,
                    drive_temp_c REAL,
                    drive_cb_temp_c REAL,
                    motor_thermal_stress_percent REAL,
                    latest_fault TEXT,
                    speed_at_fault REAL,
                    frequency_at_fault REAL,
                    voltage_at_fault REAL,
                    current_at_fault REAL,
                    torque_at_fault REAL,
                    status_at_fault TEXT
                )
            ''')
            print("Created operating_data_water_pump table")
        else:
            print("Table operating_data_water_pump already exists")

        conn.commit()
        conn.close()

    def log_operating_data(self, data):
        print("Logging operating data:", data)  # Debugging line
        
        operating_data = OperatingData(
            speed_rpm=data.get('speed_rpm'),
            output_frequency=data.get('output_frequency'),
            current_amps=data.get('current_amps'),
            torque_percent=data.get('torque_percent'),
            power_kw=data.get('power_kw'),
            dc_bus_voltage=data.get('dc_bus_voltage'),
            output_voltage=data.get('output_voltage'),
            drive_temp_c=data.get('drive_temp_c'),
            drive_cb_temp_c=data.get('drive_cb_temp_c'),
            motor_thermal_stress_percent=data.get('motor_thermal_stress_percent'),
            latest_fault=data.get('latest_fault'),
            speed_at_fault=data.get('speed_at_fault'),
            frequency_at_fault=data.get('freq_at_fault'),
            voltage_at_fault=data.get('voltage_at_fault'),
            current_at_fault=data.get('current_at_fault'),
            torque_at_fault=data.get('torque_at_fault'),
            status_at_fault=data.get('status_at_fault')
        )
        
        self.session.add(operating_data)
        self.session.commit()
    
    def log_operating_data_water_pump(self, data):
        print("Logging operating data for water pump:", data)  # Debugging line
        
        operating_data = OperatingDataWaterPump(
            speed_rpm=data.get('speed_rpm'),
            output_frequency=data.get('output_frequency'),
            current_amps=data.get('current_amps'),
            torque_percent=data.get('torque_percent'),
            power_kw=data.get('power_kw'),
            dc_bus_voltage=data.get('dc_bus_voltage'),
            output_voltage=data.get('output_voltage'),
            drive_temp_c=data.get('drive_temp_c'),
            drive_cb_temp_c=data.get('drive_cb_temp_c'),
            motor_thermal_stress_percent=data.get('motor_thermal_stress_percent'),
            latest_fault=data.get('latest_fault'),
            speed_at_fault=data.get('speed_at_fault'),
            frequency_at_fault=data.get('freq_at_fault'),
            voltage_at_fault=data.get('voltage_at_fault'),
            current_at_fault=data.get('current_at_fault'),
            torque_at_fault=data.get('torque_at_fault'),
            status_at_fault=data.get('status_at_fault')
        )
        
        self.session.add(operating_data)
        self.session.commit()

    def get_recent_operating_data(self):
        return self.session.query(OperatingData)\
            .order_by(desc(OperatingData.timestamp))\
            .all()
    
    def get_recent_operating_data_water_pump(self):
        return self.session.query(OperatingDataWaterPump)\
            .order_by(desc(OperatingDataWaterPump.timestamp))\
            .all()

'''if __name__ == "__main__":
    # Create database instance
    db = Database()

    # Example of logging operating data
    sample_data = {
        'speed_rpm': 100,
        'output_frequency': 3,
        'current_amps': 10,
        'torque_percent': 75,
        'power_kw': 5,
        'dc_bus_voltage': 4,
        'output_voltage': 460,
        'drive_temp_c': 40,
        'drive_cb_temp_c': 35,
        'motor_thermal_stress_percent': 60,
        'latest_fault': 'None',
        'speed_at_fault': 0,
        'freq_at_fault': 0,
        'voltage_at_fault': 0,
        'current_at_fault': 0,
        'torque_at_fault': 0,
        'status_at_fault': 'Normal'
    }

    db.log_operating_data(sample_data)'''
