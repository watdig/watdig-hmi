import paho.mqtt.client as mqtt
from typing import Dict, Any
import json
from Services.logger_service import info, error
import threading
import time
import os

class MQTTService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MQTTService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.broker = os.getenv('MQTT_BROKER_HOST', 'localhost')
        self.port = int(os.getenv('MQTT_BROKER_PORT', 1883))
        self.keepalive = int(os.getenv('MQTT_KEEPALIVE', 60))
        self.retry_interval = int(os.getenv('MQTT_RETRY_INTERVAL', 5))
        self.max_retries = int(os.getenv('MQTT_MAX_RETRIES', 12))
        
        self.client = mqtt.Client()
        self.connected = False
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        
        self._initialized = True
        self._start_connection_monitor()

    def _start_connection_monitor(self):
        """Start the connection monitor in a separate thread"""
        self._monitor_thread = threading.Thread(target=self._connection_monitor, daemon=True)
        self._monitor_thread.start()

    def _connection_monitor(self):
        """Monitor connection and attempt reconnection if necessary"""
        while True:
            if not self.connected:
                info("Attempting to reconnect to MQTT broker...")
                self.connect()
            time.sleep(self.retry_interval)

    def connect(self) -> bool:
        """Connect to MQTT broker with retry logic"""
        retries = 0
        while retries < self.max_retries and not self.connected:
            try:
                info(f"Connecting to MQTT broker at {self.broker}:{self.port}")
                self.client.connect(self.broker, self.port, self.keepalive)
                self.client.loop_start()
                return True
            except Exception as e:
                retries += 1
                error(f"Failed to connect to MQTT broker (attempt {retries}/{self.max_retries}): {str(e)}")
                time.sleep(self.retry_interval)
        return False

    def disconnect(self):
        """Disconnect from MQTT broker"""
        try:
            self.client.loop_stop()
            self.client.disconnect()
            info("Disconnected from MQTT broker")
        except Exception as e:
            error(f"Error disconnecting from MQTT broker: {str(e)}")

    def publish(self, topic: str, payload: Dict[str, Any], retain: bool = False) -> bool:
        """Publish message to MQTT topic"""
        try:
            if not self.connected:
                error("Not connected to MQTT broker")
                return False
                
            message = json.dumps(payload)
            result = self.client.publish(topic, message, retain=retain)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                info(f"Successfully published to {topic}")
                return True
            else:
                error(f"Failed to publish to {topic}")
                return False
        except Exception as e:
            error(f"Error publishing to {topic}: {str(e)}")
            return False

    def _on_connect(self, client, userdata, flags, rc):
        """Callback for when the client connects to the broker"""
        if rc == 0:
            info("Connected to MQTT broker")
            self.connected = True
        else:
            error(f"Failed to connect to MQTT broker with code: {rc}")
            self.connected = False

    def _on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the broker"""
        info("Disconnected from MQTT broker")
        self.connected = False

    def _on_publish(self, client, userdata, mid):
        """Callback for when a message is published"""
        info(f"Message {mid} published successfully") 