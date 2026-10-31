# TwinSense — Overall System Architecture

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph "Edge / Simulation Tier (Wokwi)"
        ESP32["ESP32 Microcontroller (sketch.ino)"]
        DHT["DHT22 (Temperature & Humidity)"]
        POT["Potentiometer (Vibration / Load Proxy)"]
        LEDS["Hardware LEDs (Normal / Warn / Crit)"]
        DHT -->|GPIO 15| ESP32
        POT -->|GPIO 34 ADC| ESP32
        ESP32 -->|GPIO 18,19,21| LEDS
    end

    subgraph "IoT Messaging Tier"
        WIFI["Simulated Virtual Wi-Fi (Wokwi-GUEST)"]
        BROKER["MQTT Broker (HiveMQ / Mosquitto)"]
        ESP32 -->|Wi-Fi 802.11| WIFI
        WIFI -->|MQTT Port 1883 / TLS 8883| BROKER
    end

    subgraph "Backend Tier (Python / FastAPI)"
        MQTT_CONS["Paho MQTT Consumer Thread"]
        FALLBACK["Mode 2: Software Fallback Engine"]
        BROKER -->|twinsense/+/telemetry| MQTT_CONS
        
        VAL["Data Validation & Ingestion (Pydantic)"]
        MQTT_CONS --> VAL
        FALLBACK --> VAL

        subgraph "Intelligence & Persistence"
            DB[(SQLite Persistence / SQLAlchemy)]
            ISO["Unsupervised Isolation Forest (Anomaly)"]
            RF["Supervised Random Forest (Risk Classifier)"]
            VAL --> DB
            VAL --> ISO
            VAL --> RF
        end

        API["FastAPI REST Endpoints (/api)"]
        WS["WebSocket Broadcaster (/ws/telemetry)"]
        VAL --> WS
        DB --> API
        RF --> API
        ISO --> API
    end

    subgraph "Presentation Tier (React.js / Vite)"
        DASH["React Engineering Dashboard"]
        CANVAS["Interactive 3D Digital Twin (Three.js / Fiber)"]
        CHARTS["Real-Time Streaming Charts (Recharts)"]
        HUB["Maintenance Work Orders (ISO 55000)"]
        
        API -->|HTTP REST| DASH
        WS -->|Live Telemetry Stream| DASH
        DASH --> CANVAS
        DASH --> CHARTS
        DASH --> HUB
    end
```

---

## 2. Dual Operating Modes

### Mode 1: Connected IoT Simulation
1. Sensor readings originate from the **ESP32** running in Wokwi.
2. The firmware samples the DHT22 and potentiometer proxy every 2000ms.
3. Telemetry is serialized into structured JSON and published to `twinsense/MOTOR-001/telemetry`.
4. The Python backend receives the MQTT packet, runs ML inference, stores the reading in SQLite, and broadcasts the digital twin state over `/ws/telemetry`.

### Mode 2: Software Fallback Simulation
1. Active when Wokwi is disconnected or when local testing without internet access is desired.
2. The Python `fallback_simulator` generates authentic physical readings with mathematical micro-jitter and realistic slip curves.
3. Data is explicitly tagged with `source: "software_fallback"`. It is never misrepresented as physical hardware telemetry.
