import sqlite3
from datetime import datetime
from tabulate import tabulate

class Database:
    def __init__(self, db_file="modbus_logs.db"):
        self.db_file = db_file
        self.init_database()

    def init_database(self):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()

        # Create operating data table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS operating_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            speed_rpm FLOAT,
            output_frequency FLOAT,
            current_amps FLOAT,
            torque_percent FLOAT,
            power_kw FLOAT,
            dc_bus_voltage FLOAT,
            output_voltage FLOAT,
            drive_temp_c FLOAT,
            drive_cb_temp_c FLOAT,
            motor_thermal_stress_percent FLOAT
        )
        ''')

        # Create fault history table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS fault_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            fault_code INTEGER,
            speed_at_fault FLOAT,
            frequency_at_fault FLOAT,
            voltage_at_fault FLOAT,
            current_at_fault FLOAT,
            torque_at_fault FLOAT,
            status_at_fault INTEGER
        )
        ''')

        conn.commit()
        conn.close()

    def log_operating_data(self, data):
        print("Logging operating data:", data)  # Debugging line
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO operating_data (
            speed_rpm, output_frequency, current_amps, torque_percent,
            power_kw, dc_bus_voltage, output_voltage, drive_temp_c,
            drive_cb_temp_c, motor_thermal_stress_percent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('speed_rpm'),
            data.get('output_frequency'),
            data.get('current_amps'),
            data.get('torque_percent'),
            data.get('power_kw'),
            data.get('dc_bus_voltage'),
            data.get('output_voltage'),
            data.get('drive_temp_c'),
            data.get('drive_cb_temp_c'),
            data.get('motor_thermal_stress_percent')
        ))
        
        conn.commit()
        conn.close()

    def log_fault(self, fault_data):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO fault_history (
            fault_code, speed_at_fault, frequency_at_fault,
            voltage_at_fault, current_at_fault, torque_at_fault,
            status_at_fault
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            fault_data.get('fault_code'),
            fault_data.get('speed_at_fault'),
            fault_data.get('frequency_at_fault'),
            fault_data.get('voltage_at_fault'),
            fault_data.get('current_at_fault'),
            fault_data.get('torque_at_fault'),
            fault_data.get('status_at_fault')
        ))
        
        conn.commit()
        conn.close()

    def get_recent_operating_data(self, limit=100):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM operating_data 
        ORDER BY timestamp DESC 
        LIMIT ?
        ''', (limit,))
        
        data = cursor.fetchall()
        conn.close()
        return data

    def get_recent_faults(self, limit=50):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM fault_history 
        ORDER BY timestamp DESC 
        LIMIT ?
        ''', (limit,))
        
        data = cursor.fetchall()
        conn.close()
        return data 

if __name__ == "__main__":
    # Create database instance
    db = Database()

    # Example of logging operating data
    sample_data = {
        'speed_rpm': 1500,
        'output_frequency': 3,
        'current_amps': 10,
        'torque_percent': 75,
        'power_kw': 5,
        'dc_bus_voltage': 4,
        'output_voltage': 460,
        'drive_temp_c': 40,
        'drive_cb_temp_c': 35,
        'motor_thermal_stress_percent': 60
    }

    db.log_operating_data(sample_data)
