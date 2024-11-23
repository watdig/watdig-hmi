import time
import requests
import sqlite3
from database import Database

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

def poll_data():
    while True:
        results = {}
        for key, endpoint in API_ENDPOINTS.items():
            results[key] = fetch_data(endpoint)

        # Prepare data for logging
        data_to_log = {
            "speed_rpm": results["speed_dir"].get("Speed & Direction", {}).get("value"),
            "output_frequency": results["output_frequency"].get("Output Frequency", {}).get("value"),
            "current_amps": results["current"].get("Current", {}).get("value"),
            "torque_percent": results["torque"].get("Torque", {}).get("value"),
            "power_kw": results["power"].get("Power", {}).get("value"),
            "dc_bus_voltage": results["dc_bus_voltage"].get("DC Bus Voltage", {}).get("value"),
            "output_voltage": results["output_voltage"].get("Output Voltage", {}).get("value"),
            "drive_temp_c": results["drive_temp"].get("Drive Temperature", {}).get("value"),
            "drive_cb_temp_c": results["drive_cb_temp"].get("Drive CB Temperature", {}).get("value"),
            "motor_thermal_stress_percent": results["mot_therm_stress"].get("Motor Thermal Stress", {}).get("value"),
        }

        # Log the data into the database
        db.log_operating_data(data_to_log)

        # Wait for 0.1 seconds before the next poll
        time.sleep(2)

if __name__ == "__main__":
    try:
        poll_data()
    except KeyboardInterrupt:
        print("Polling stopped.") 