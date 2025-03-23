import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import math
import random
from Services.CritSrvs.mqtt_service import MQTTService

def generate_tbm_data(elapsed_time):
    """Generate simulated TBM data with realistic variations"""
    # Base movement calculations (assuming constant advance rate)
    advance_rate = 0.005  # meters per second
    distance = elapsed_time * advance_rate
    
    # Calculate position with slight variations
    chainage = distance
    easting = distance * math.cos(math.radians(45))  # Assuming 45-degree heading
    northing = distance * math.sin(math.radians(45))
    
    # Add some realistic variations
    elevation = 10 + math.sin(elapsed_time / 10) * 0.5  # Slight up/down variation
    roll = math.sin(elapsed_time / 5) * 0.02  # Small roll variations
    pitch = math.cos(elapsed_time / 7) * 0.015  # Small pitch variations
    heading = 45 + math.sin(elapsed_time / 15) * 2  # Slight heading variations

    return {
        "team": "WatDig",
        "timestamp": int(time.time()),
        "mining": True,
        "chainage": round(chainage, 3),
        "easting": round(easting, 3),
        "northing": round(northing, 3),
        "elevation": round(elevation, 3),
        "roll": round(roll, 4),
        "pitch": round(pitch, 4),
        "heading": round(math.radians(heading), 4),  # Convert to radians
        # Additional optional data
        "thrust": random.uniform(980, 1020),  # kN
        "torque": random.uniform(290, 310),   # kNm
        "rpm": random.uniform(3.8, 4.2),      # RPM
        "power": random.uniform(290, 310),    # kW
    }

if __name__ == "__main__":
    mqtt = MQTTService()
    
    # Wait for connection to establish
    print("Waiting for MQTT connection...")
    retry_count = 0
    max_retries = 10
    
    while not mqtt.connected and retry_count < max_retries:
        mqtt.connect()
        time.sleep(1)
        retry_count += 1
        print(f"Connection attempt {retry_count}/{max_retries}...")

    if mqtt.connected:
        print("Connected to MQTT broker!")
        start_time = time.time()
        
        try:
            while True:
                elapsed_time = time.time() - start_time
                payload = generate_tbm_data(elapsed_time)
                
                success = mqtt.publish("WatDig", payload)
                if success:
                    print(f"Published data: Chainage={payload['chainage']:.2f}m, "
                          f"RPM={payload['rpm']:.1f}, "
                          f"Thrust={payload['thrust']:.0f}kN")
                else:
                    print("Failed to publish message")
                
                # Wait before sending next update
                time.sleep(1)  # Update every second
                
        except KeyboardInterrupt:
            print("\nStopping MQTT publisher...")
            mqtt.disconnect()
            print("Disconnected from MQTT broker")
            
    else:
        print("Failed to connect to MQTT broker after multiple attempts")