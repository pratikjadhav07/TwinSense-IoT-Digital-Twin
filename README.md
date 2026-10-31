# TwinSense — IoT-Based Digital Twin for Predictive Maintenance

[![Project Status: Complete](https://img.shields.io/badge/Project%20Status-Complete%20%26%20Tested-10B981?style=for-the-badge)](#)
[![Stack](https://img.shields.io/badge/Stack-React_18_%7C_Three.js_%7C_FastAPI_%7C_ESP32-06B6D4?style=for-the-badge)](#)

TwinSense is an academic and industrial engineering project demonstrating a complete, hardware-free **Digital Twin for Predictive Maintenance** of three-phase AC induction motors.

The system connects an **ESP32 IoT simulation in Wokwi**, transmits sensor telemetry over **MQTT**, analyzes degradation using **Isolation Forest & Random Forest Machine Learning**, persists events in **SQLite**, and synchronizes a **3D Virtual Motor Twin in React.js** over real-time **WebSockets**.

---

## 🏗️ Repository Architecture

```
IOT_Advance/
├── frontend/                 # React 18, Vite, Tailwind CSS, Three.js, Recharts
│   ├── src/
│   │   ├── components/       # Header, Sidebar, MetricCard, AlertBanner
│   │   ├── digital-twin/     # 3D Motor Procedural Model (Three.js/Fiber)
│   │   ├── pages/            # Overview, DigitalTwin, LiveSensors, ML, Maintenance
│   │   ├── services/         # REST API Client (Fetch)
│   │   ├── hooks/            # WebSocket Telemetry Stream Hook
│   │   ├── data/             # Strictly labelled Preview Data Fallback
│   │   └── App.jsx           # Main State Router
│   └── package.json
├── backend/                  # Python 3, FastAPI, Uvicorn, SQLAlchemy, Scikit-Learn
│   ├── app/
│   │   ├── api/              # REST Endpoints & WebSocket (/ws/telemetry)
│   │   ├── core/             # Configuration & Settings
│   │   ├── db/               # SQLite Models, Session, and Seeding
│   │   ├── ml/               # Training Pipeline, Scikit-Learn Models, Inference
│   │   ├── services/         # Telemetry Ingestion Engine & Paho MQTT Client
│   │   ├── simulator/        # Mode 2: Software Fallback Generator
│   │   └── main.py           # FastAPI Application Entrypoint
│   ├── tests/                # Unit & Integration Test Suite (12 passing tests)
│   └── requirements.txt
├── wokwi/                    # Wokwi ESP32 IoT Edge Simulation
│   ├── diagram.json          # Circuit Schematic (ESP32 + DHT22 + Potentiometer + LEDs)
│   ├── sketch.ino            # Arduino C++ Firmware (WiFi + MQTT + Motor Model)
│   ├── libraries.txt         # Wokwi Library Manager Requirements
│   └── README.md             # Simulation Guide
└── docs/                     # Engineering Documentation
    ├── architecture.md       # Mermaid Architecture Diagram
    ├── api.md                # REST & WebSocket API Specification
    ├── mqtt-setup.md         # Broker Setup & Topic Hierarchy
    └── model-methodology.md  # ML Principles & RUL Calibration Notice
```

---

## ⚡ Quickstart Guide (Windows & VS Code)

### Terminal 1: Python Backend
```powershell
cd c:\Users\Pratik\Downloads\IOT_Advance\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/docs`
- WebSocket Stream: `ws://localhost:8000/ws/telemetry`

### Terminal 2: React Frontend Dashboard
```powershell
cd c:\Users\Pratik\Downloads\IOT_Advance\frontend
npm run dev
```
- Open browser to: `http://localhost:5173`

### Terminal 3: Wokwi ESP32 Simulation
1. Visit [https://wokwi.com/](https://wokwi.com/) and select **ESP32**.
2. Paste [`wokwi/diagram.json`](file:///c:/Users/Pratik/Downloads/IOT_Advance/wokwi/diagram.json) into the `diagram.json` tab.
3. Paste [`wokwi/sketch.ino`](file:///c:/Users/Pratik/Downloads/IOT_Advance/wokwi/sketch.ino) into the `sketch.ino` tab.
4. Click the **Play** button!
5. Telemetry immediately publishes to `broker.hivemq.com` and streams into your local FastAPI backend and React dashboard.

---

## 🎮 Dual Operating Modes

| Feature | Mode 1: Connected IoT Simulation | Mode 2: Software Fallback Simulation |
| :--- | :--- | :--- |
| **Origin** | ESP32 in Wokwi simulator | Python background mathematical generator |
| **Transport** | Wi-Fi 802.11 &rarr; MQTT Port 1883 | In-process Python service |
| **Fault Injection** | Turn Potentiometer or adjust DHT22 slider in Wokwi | Select scenario button in Dashboard UI |
| **Labeling** | Explicitly labelled `wokwi_esp32` | Explicitly labelled `software_fallback` |

---

## 🧠 Machine Learning Methodology

1. **Unsupervised Anomaly Detection (`IsolationForest`)**:
   - Isolates multivariate feature outliers (Temperature, Vibration Proxy, RPM Slip, Electrical Load).
   - Contamination parameter set to `0.05`.
   - Real-time decision boundary: `score < 0.00` flags anomaly.
2. **Supervised Maintenance-Risk Classification (`RandomForestClassifier`)**:
   - Classifies operating health into `Normal`, `Elevated Risk`, or `Critical Condition`.
   - 80/20 Holdout test evaluation: **99.9% Accuracy**, **1.00 ROC-AUC**.

---

## 🎓 College Demonstration Walkthrough Script

1. **Start System**: Launch backend (`uvicorn`) and frontend (`npm run dev`). Open dashboard at `http://localhost:5173`.
2. **Show Digital Twin**:
   - Open the **Digital Twin** tab. Observe the 3D induction motor rotating smoothly with shaft speed synchronized to RPM.
   - Orbit, zoom, and pan around the motor to showcase housing, cooling fins, end bells, and terminal conduit box.
3. **Trigger Fault in Simulation**:
   - On the **Overview** or **Settings** page, click **"Overheat"** or **"Vibration"**.
   - Watch the cooling fins on the 3D model turn warning amber/red hot.
   - Notice the high-frequency vibration wobble applied to the virtual motor body.
   - Observe the health score drop from 94.2 down to 61.5.
4. **Inspect Predictive Analytics & Anomalies**:
   - Open **Predictive ML** tab: Explain the holdout confusion matrix, feature importances (Vibration &gt; Temperature &gt; Slip), and class probabilities.
   - Open **Anomaly Detection** tab: Point out the 2D scatter phase plane where the abnormal reading is flagged as an outlier vector.
5. **Close the Loop with Maintenance**:
   - Switch to **Maintenance Hub**.
   - Acknowledge the generated alarm (`ALT-1081`).
   - Start task, add resolution notes (*"Inspected drive bearing; synthetic grease replenished"*), and mark as resolved. All records persist in SQLite.
