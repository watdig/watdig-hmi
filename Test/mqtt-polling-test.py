import time
import requests
import sqlite3
from Services.database_service import Database
from Services.CritSrvs.mqtt_service import MQTTService

if __name__ == "__main__":
    mqtt = MQTTService()
    
    # Wait for connection to establish
    print("Waiting for MQTT connection...")
    retry_count = 0
    max_retries = 10
    
    while not mqtt.connected and retry_count < max_retries:
        mqtt.connect()
        time.sleep(1)  # Wait a second between connection attempts
        retry_count += 1
        print(f"Connection attempt {retry_count}/{max_retries}...")

    if mqtt.connected:
        print("Connected to MQTT broker!")
        payload = {
                "team": "WatDig",
                "timestamp": int(time.time()),  # Current UNIX timestamp
                "mining": True,  # You might want to make this dynamic based on your system state
                "chainage": 0.0,  # Replace with actual chainage
                "easting": 0.0,   # Replace with actual easting
                "northing": 0.0,  # Replace with actual northing
                "elevation": 0.0, # Replace with actual elevation
                "roll": 0.0,     # Replace with actual roll in radians
                "pitch": 0.0,    # Replace with actual pitch in radians
                "heading": 0.0,  # Replace with actual heading in radians
                "extra": {
                    "speed_rpm": 3,
                    "torque_percent": 0,
                }
            }

        success = mqtt.publish("WatDig", payload)
        if success:
            print("Message published successfully!")
        else:
            print("Failed to publish message")
    else:
        print("Failed to connect to MQTT broker after multiple attempts")