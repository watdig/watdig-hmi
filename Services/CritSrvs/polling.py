import time
import requests
import sqlite3
from Services.database_service import Database

# Initialize the database
db = Database()

# Define the API endpoints
API_ENDPOINTS = {
    "speed_dir": "http://127.0.0.1:8080/api/data/speed-dir",
    "output_frequency": "http://127.0.0.1:8080/api/data/output-frequency",
    "current": "http://127.0.0.1:8080/api/data/current",
    "torque": "http://127.0.0.1:8080/api/data/torque",
    "power": "http://127.0.0.1:8080/api/data/power",
    "dc_bus_voltage": "http://127.0.0.1:8080/api/data/dc-bus-voltage",
    "output_voltage": "http://127.0.0.1:8080/api/data/output-voltage",
    "drive_temp": "http://127.0.0.1:8080/api/data/drive-temp",
    "drive_cb_temp": "http://127.0.0.1:8080/api/data/drive-cb-temp",
    "mot_therm_stress": "http://127.0.0.1:8080/api/data/mot-therm-stress",
    "latest_fault": "http://127.0.0.1:8080/api/fault/latest-fault",
    "speed_at_fault": "http://127.0.0.1:8080/api/fault/speed-at-fault",
    "freq_at_fault": "http://127.0.0.1:8080/api/fault/freq-at-fault",
    "voltage_at_fault": "http://127.0.0.1:8080/api/fault/voltage-at-fault",
    "current_at_fault": "http://127.0.0.1:8080/api/fault/current-at-fault",
    "torque_at_fault": "http://127.0.0.1:8080/api/fault/torque-at-fault",
    "status_at_fault": "http://127.0.0.1:8080/api/fault/status-at-fault",
}

API_ENDPOINTS_WATER_PUMP = {
    "speed_dir": "http://127.0.0.1:8080/api/wp/data/speed-dir",
    "output_frequency": "http://127.0.0.1:8080/api/wp/data/output-frequency",
    "current": "http://127.0.0.1:8080/api/wp/data/current",
    "torque": "http://127.0.0.1:8080/api/wp/data/torque",
    "power": "http://127.0.0.1:8080/api/wp/data/power",
    "dc_bus_voltage": "http://127.0.0.1:8080/api/wp/data/dc-bus-voltage",
    "output_voltage": "http://127.0.0.1:8080/api/wp/data/output-voltage",
    "drive_temp": "http://127.0.0.1:8080/api/wp/data/drive-temp",
    "drive_cb_temp": "http://127.0.0.1:8080/api/wp/data/drive-cb-temp",
    "mot_therm_stress": "http://127.0.0.1:8080/api/wp/data/mot-therm-stress",
    "latest_fault": "http://127.0.0.1:8080/api/wp/fault/latest-fault",
    "speed_at_fault": "http://127.0.0.1:8080/api/wp/fault/speed-at-fault",
    "freq_at_fault": "http://127.0.0.1:8080/api/wp/fault/freq-at-fault",
    "voltage_at_fault": "http://127.0.0.1:8080/api/wp/fault/voltage-at-fault",
    "current_at_fault": "http://127.0.0.1:8080/api/wp/fault/current-at-fault",
    "torque_at_fault": "http://127.0.0.1:8080/api/wp/fault/torque-at-fault",
    "status_at_fault": "http://127.0.0.1:8080/api/wp/fault/status-at-fault",
}

def fetch_data(endpoint):
    try:
        response = requests.get(endpoint)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching data from {endpoint}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception occurred while fetching data from {endpoint}: {str(e)}")
        return None

def prepare_data_to_log(results):
    data_fields = {
        "speed_rpm": ("speed_dir", "Speed & Direction"),
        "output_frequency": ("output_frequency", "Output Frequency"),
        "current_amps": ("current", "Current"),
        "torque_percent": ("torque", "Torque"),
        "power_kw": ("power", "Power"),
        "dc_bus_voltage": ("dc_bus_voltage", "DC Bus Voltage"),
        "output_voltage": ("output_voltage", "Output Voltage"),
        "drive_temp_c": ("drive_temp", "Drive Temperature"),
        "drive_cb_temp_c": ("drive_cb_temp", "Drive CB Temperature"),
        "motor_thermal_stress_percent": ("mot_therm_stress", "Motor Thermal Stress"),
        "latest_fault": ("latest_fault", "Latest Fault"),
        "speed_at_fault": ("speed_at_fault", "Speed at Fault"),
        "freq_at_fault": ("freq_at_fault", "Frequency at Fault"),
        "voltage_at_fault": ("voltage_at_fault", "Voltage at Fault"),
        "current_at_fault": ("current_at_fault", "Current at Fault"),
        "torque_at_fault": ("torque_at_fault", "Torque at Fault"),
        "status_at_fault": ("status_at_fault", "Status at Fault"),
    }
    
    return {
        key: results[api_key].get(display_name, {}).get("value")
        for key, (api_key, display_name) in data_fields.items()
    }

def poll_data():
    while True:
        results = {key: fetch_data(endpoint) for key, endpoint in API_ENDPOINTS.items()}
        results_wp = {key: fetch_data(endpoint) for key, endpoint in API_ENDPOINTS_WATER_PUMP.items()}

        db.log_operating_data(prepare_data_to_log(results))
        db.log_operating_data_water_pump(prepare_data_to_log(results_wp))

        time.sleep(0.1)

def start_polling():
    try:
        poll_data()
    except KeyboardInterrupt:
        print("Polling stopped.")

if __name__ == "__main__":
    start_polling() 