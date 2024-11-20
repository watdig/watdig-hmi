import asyncio
import aiohttp
import time
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

async def fetch_data(session, endpoint):
    async with session.get(endpoint) as response:
        if response.status == 200:
            return await response.json()
        else:
            return None

async def poll_data():
    async with aiohttp.ClientSession() as session:
        while True:
            tasks = [fetch_data(session, endpoint) for endpoint in API_ENDPOINTS.values()]
            results = await asyncio.gather(*tasks)

            # Prepare data for logging
            data_to_log = {
                "speed_rpm": results[0].get("Speed & Direction", {}).get("value"),
                "output_frequency": results[1].get("Output Frequency", {}).get("value"),
                "current_amps": results[2].get("Current", {}).get("value"),
                "torque_percent": results[3].get("Torque", {}).get("value"),
                "power_kw": results[4].get("Power", {}).get("value"),
                "dc_bus_voltage": results[5].get("DC Bus Voltage", {}).get("value"),
                "output_voltage": results[6].get("Output Voltage", {}).get("value"),
                "drive_temp_c": results[7].get("Drive Temperature", {}).get("value"),
                "drive_cb_temp_c": results[8].get("Drive CB Temperature", {}).get("value"),
                "motor_thermal_stress_percent": results[9].get("Motor Thermal Stress", {}).get("value"),
            }

            # Log the data into the database
            db.log_operating_data(data_to_log)

            # Wait for 0.1 seconds before the next poll
            await asyncio.sleep(0.1)

if __name__ == "__main__":
    try:
        asyncio.run(poll_data())
    except KeyboardInterrupt:
        print("Polling stopped.") 