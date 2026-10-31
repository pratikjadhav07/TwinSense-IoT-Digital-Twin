# TwinSense — Wokwi ESP32 IoT Simulation

This directory contains the complete, verified hardware simulation files for the **TwinSense Digital Twin Edge Node**.

---

## 1. Circuit Components & Pinout

| Component | Part ID | ESP32 Pin | Purpose |
| :--- | :--- | :--- | :--- |
| **ESP32 DevKit v1** | `esp` | — | 240MHz dual-core IoT edge micro-controller |
| **DHT22 Sensor** | `dht22` | `GPIO 15` (SDA) | Stator core temperature & ambient humidity |
| **Potentiometer** | `pot_vib` | `GPIO 34` (ADC1) | Controllable vibration proxy & motor load |
| **Normal LED** (Green) | `led_green` | `GPIO 18` | Lights up when all metrics are nominal |
| **Warning LED** (Yellow) | `led_yellow` | `GPIO 19` | Lights up when temp &gt;65°C or vib &gt;0.50g |
| **Critical LED** (Red) | `led_red` | `GPIO 21` | Lights up when temp &ge;80°C or vib &ge;0.75g |
| **Current Resistors** | `r_*` (220Ω) | Series | LED current protection |

---

## 2. How to Run in Wokwi

1. Open [Wokwi ESP32 Simulator](https://wokwi.com/).
2. Click **"New Project"** &rarr; Select **ESP32**.
3. Replace the code in the **`sketch.ino`** tab with [`wokwi/sketch.ino`](file:///c:/Users/Pratik/Downloads/IOT_Advance/wokwi/sketch.ino).
4. Replace the **`diagram.json`** tab content with [`wokwi/diagram.json`](file:///c:/Users/Pratik/Downloads/IOT_Advance/wokwi/diagram.json).
5. In the **`Library Manager`** (or `libraries.txt`), verify the following are included:
   - `DHT sensor library`
   - `Adafruit Unified Sensor`
   - `PubSubClient`
   - `ArduinoJson`
6. Click the green **Play** button to start simulation.
7. Open the **Serial Monitor** at **115200 baud**.

---

## 3. How to Trigger Fault Scenarios in Simulation

- **Normal Baseline**:
  - Keep potentiometer dial at ~20% (low position).
  - Keep DHT22 at 50°C.
  - Green LED lights up; vibration proxy ~0.25g; RPM ~1485.
- **Overheating Fault**:
  - Click the **DHT22** sensor icon in Wokwi while running.
  - Drag the temperature slider past **65°C** (Warning) or **80°C** (Critical).
  - Observe Yellow/Red LED activate and MQTT telemetry reflect the spike.
- **Excessive Vibration & Mechanical Load Fault**:
  - Drag the **Potentiometer** knob towards the right (&gt;75%).
  - Vibration proxy will surge past 0.75g and slip increases, pulling RPM down to ~1350.
  - Red Critical LED turns on.

---

## 4. Telemetry Payload Format

The ESP32 publishes structured JSON to `twinsense/MOTOR-001/telemetry`:

```json
{
  "machine_id": "MOTOR-001",
  "source": "wokwi_esp32",
  "temperature_c": 54.2,
  "humidity_percent": 42.0,
  "vibration_proxy": 0.34,
  "rpm": 1480,
  "load_percent": 55,
  "timestamp_ms": 14200,
  "status": "NORMAL"
}
```
