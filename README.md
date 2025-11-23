# WatDig HMI - Tunnel Boring Machine Control System

Human-Machine Interface for monitoring and controlling the WatDig Design Team's Tunnel Boring Machine (TBM)

## Overview

The WatDig HMI is a full-stack industrial control system designed to monitor and control a Tunnel Boring Machine. The system features a **Flask-based backend** with real-time communication capabilities and a React-based frontend for visualization and control.

## System Architecture

### Backend Stack (Primary Focus)

The backend is built with **Python/Flask** and implements multiple industrial communication protocols:

#### Communication Protocols

1. **Modbus RTU (RS-485)**
   - Primary protocol for VFD (Variable Frequency Drive) communication
   - Serial communication over RS-485
   - Supports both Cutter Face VFD and Water Pump VFD
   - Implementation: `Services/modbus_service.py`
   - Configuration:
     - Baudrate: 9600
     - Parity: None
     - Stopbits: 1
     - Bytesize: 8
     - Timeout: 2 seconds

2. **MQTT (Message Queuing Telemetry Transport)**
   - Used for real-time data publishing and system monitoring
   - Broker: Eclipse Mosquitto (containerized)
   - Implementation: `Services/CritSrvs/mqtt_service.py`
   - Default ports: 1883 (MQTT), 9001 (WebSocket)
   - Features:
     - Singleton pattern for connection management
     - Automatic reconnection with retry logic
     - Connection health monitoring

3. **HTTP/REST API**
   - Flask server exposing RESTful endpoints
   - Default port: 5000
   - CORS enabled for cross-origin requests from frontend
   - Implementation: `Services/CritSrvs/server.py`

#### Backend Services

- **`modbus_service.py`**: Modbus RTU client for reading/writing VFD registers
- **`database_service.py`**: SQLite database management for operational data logging
- **`logger_service.py`**: Centralized logging service
- **`mqtt_service.py`**: MQTT client with automatic reconnection
- **`modbus_routes.py`**: Flask Blueprint for Modbus API endpoints
- **`server.py`**: Main Flask application with all HTTP endpoints
- **`polling.py`**: Background polling service for continuous data acquisition

#### Key Backend Features

- **Real-time VFD Control**: Read/write holding and input registers
- **Operational Data Logging**: SQLite database with two tables:
  - `operating_data`: Cutter face VFD metrics
  - `operating_data_water_pump`: Water pump VFD metrics
- **Fault Monitoring**: Track and log fault codes, speeds, voltages at fault events
- **Background Polling**: Continuous data acquisition from Modbus devices
- **Error Handling**: Comprehensive error handling with retry logic

### Frontend Stack

Built with **React 18** and **Material-UI (MUI)**:

- **UI Framework**: Material-UI v6 with Emotion styling
- **HTTP Client**: Axios for API communication
- **Visualization**: 
  - React Gauge Chart for real-time metrics
  - Three.js for 3D visualizations
  - RC Slider for control inputs
- **State Management**: Context API for TBM state management

## Project Structure

```
watdig-hmi/
├── Services/                      # Backend services
│   ├── CritSrvs/                 # Critical services
│   │   ├── mqtt_service.py       # MQTT client implementation
│   │   ├── polling.py            # Background polling service
│   │   └── server.py             # Main Flask server
│   ├── modbus_service.py         # Modbus RTU client
│   ├── modbus_routes.py          # Modbus API endpoints
│   ├── database_service.py       # SQLite database management
│   └── logger_service.py         # Logging service
├── Models/                        # Database models (SQLAlchemy)
│   └── ModbusDB/
│       ├── operating_data_table.py
│       └── operating_data_water_pump.py
├── ActuatorControlLogic/         # Actuator control algorithms
├── src/                          # React frontend
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   └── utils/                    # Utility functions
├── docker/                       # Docker configurations
│   └── mqtt/                     # MQTT broker config
├── Test/                         # Test files
├── main.py                       # Application entry point (deprecated)
├── docker-compose.yml            # Docker Compose configuration
├── requirements.txt              # Python dependencies
└── package.json                  # Node.js dependencies
```

## Getting Started

### Prerequisites

- **Python 3.10+** (Backend)
- **Node.js 16+** (Frontend)
- **Docker & Docker Compose** (For MQTT broker)
- **RS-485 to USB adapter** (For Modbus communication)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/watdig/watdig-hmi.git
cd watdig-hmi
```

#### 2. Backend Setup

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Additional backend dependencies (not in requirements.txt):
```bash
pip install flask flask-cors pymodbus sqlalchemy tabulate
```

#### 3. Frontend Setup

Install Node.js dependencies:
```bash
npm install
```

#### 4. Start MQTT Broker (Docker)

```bash
docker-compose up -d mqtt-broker
```

This starts the Eclipse Mosquitto MQTT broker on:
- Port 1883 (MQTT)
- Port 9001 (WebSocket)

### Running the Application

#### Start Backend Server
```bash
python -m Services.CritSrvs.server
```

Or using the deprecated main entry point:
```bash
python main.py --server
```

The Flask server will start on `http://localhost:5000`

#### Start Frontend Development Server
```bash
npm start
```

The React app will start on `http://localhost:3000`

## API Endpoints

### Modbus Control Endpoints

#### Cutter Face VFD
- `GET /api/cf/startup-sequence` - Initialize cutter face motor
- `GET /api/cf/stop-motor` - Stop cutter face motor
- `GET /api/cf/reverse-motor` - Reverse cutter face motor direction
- `POST /api/cf/set-frequency` - Set cutter face frequency (-20000 to 20000)

#### Water Pump VFD
- `GET /api/wp/startup-sequence` - Initialize water pump motor
- `GET /api/wp/stop-motor` - Stop water pump motor
- `POST /api/wp/set-frequency` - Set water pump frequency

### Data Monitoring Endpoints

- `GET /api/data/speed` - Get motor speed (RPM)
- `GET /api/data/output-freq` - Get output frequency (Hz)
- `GET /api/data/current` - Get current (A)
- `GET /api/data/torque` - Get torque (%)
- `GET /api/data/power` - Get power output (kW)
- `GET /api/data/dc-bus-voltage` - Get DC bus voltage (V)
- `GET /api/data/output-voltage` - Get output voltage (V)
- `GET /api/data/drive-temp` - Get drive temperature (°C)

### Fault Monitoring Endpoints

- `GET /api/fault/latest-fault` - Get latest fault code
- `GET /api/fault/speed-at-fault` - Get speed at time of fault
- `GET /api/fault/freq-at-fault` - Get frequency at time of fault

### Generic Modbus Endpoints

- `GET /read?unitId=<id>&register=<reg>&range=<range>` - Read registers
- `POST /write` - Write to registers
  ```json
  {
    "unitId": 1,
    "register": 0,
    "value": 100
  }
  ```

## Database Schema

### Operating Data Table (Cutter Face)
- Timestamp
- Speed (RPM)
- Output Frequency (Hz)
- Current (A)
- Torque (%)
- Power (kW)
- DC Bus Voltage (V)
- Output Voltage (V)
- Drive Temperature (°C)
- Control Board Temperature (°C)
- Motor Thermal Stress (%)
- Fault information (code, speed, frequency, voltage, current, torque, status)

### Operating Data Water Pump Table
- Same schema as above, specific to water pump VFD

## Configuration

### Modbus Configuration
Edit connection parameters in `Services/modbus_service.py`:
```python
ModbusConnection(
    port='/dev/tty.usbserial-0001',  # USB-RS485 adapter
    baudrate=9600,
    parity='N',
    unit_id=1,
    stopbits=1,
    bytesize=8,
    timeout=2
)
```

### MQTT Configuration
Set environment variables:
```bash
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_KEEPALIVE=60
MQTT_RETRY_INTERVAL=5
MQTT_MAX_RETRIES=12
```

## Docker Support

The project includes Docker Compose configuration for the MQTT broker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development

### Backend Development
The backend uses:
- **Flask** for web framework
- **pymodbus** for Modbus RTU communication
- **paho-mqtt** for MQTT messaging
- **SQLAlchemy** for database ORM
- **sqlite3** for data persistence

### Frontend Development
The frontend uses:
- **React 18** with functional components and hooks
- **Material-UI** for UI components
- **Axios** for HTTP requests
- **Three.js** for 3D visualizations

## Notes

- The `main.py` entry point is deprecated. Use `python -m Services.CritSrvs.server` instead.
- Ensure the RS-485 adapter is connected before starting the backend.
- The MQTT broker must be running for full functionality.
- Default Modbus unit IDs: Cutter Face VFD = 2, Water Pump VFD = 1

---

**WatDig Design Team** | Tunnel Boring Machine Control System
