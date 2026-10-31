# TwinSense — MQTT Broker Setup & Topic Architecture

## 1. Topic Hierarchy

| Topic | Publisher | Subscriber | Purpose |
| :--- | :--- | :--- | :--- |
| `twinsense/MOTOR-001/telemetry` | ESP32 / Simulator | Python Backend | High-frequency telemetry (Temp, Vib, RPM, Load) |
| `twinsense/MOTOR-001/status` | ESP32 | Python Backend | Connection status (`ONLINE` / LWT `OFFLINE`) |
| `twinsense/MOTOR-001/commands` | Dashboard / Backend | ESP32 | Edge diagnostic commands (e.g. identify flash) |

---

## 2. Broker Options

### Option A: Cloud Broker (Recommended for Wokwi Simulation)
Because Wokwi runs in a browser sandbox on cloud infrastructure, it cannot connect to your local PC's `localhost` without a reverse tunnel.
- **Default Broker**: `broker.hivemq.com` (Port 1883)
- **Alternative**: `test.mosquitto.org` (Port 1883)
- Both are free public brokers that require zero credit cards or accounts.

### Option B: Local Mosquitto Broker (For local integration testing)
1. Install Mosquitto:
   ```powershell
   winget install EclipseFoundation.Mosquitto
   ```
2. Start Mosquitto on port 1883:
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto.exe" -v
   ```
3. Update `.env` in `backend/`:
   ```ini
   MQTT_BROKER="localhost"
   MQTT_PORT=1883
   ```

---

## 3. Reliability & QoS Decisions

- **Telemetry QoS**: `QoS 0` or `QoS 1` is used. For high-frequency continuous streaming (every 2 seconds), dropping an occasional packet is preferred over queuing stale historical buffers.
- **Last Will and Testament (LWT)**: The ESP32 registers an LWT on `twinsense/MOTOR-001/status` with `status: "OFFLINE"` and `retain: true`. If the ESP32 disconnects unexpectedly, the broker immediately notifies the backend.
- **Birth Certificate**: On successful connection, the ESP32 publishes `status: "ONLINE"` with its assigned IP address.
