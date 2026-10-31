# TwinSense — REST & WebSocket API Specification

Base URL: `http://localhost:8000/api`  
WebSocket URL: `ws://localhost:8000/ws/telemetry`  
Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`

---

## 1. REST Endpoints

### Health & Status
- **`GET /api/health`**
  - **Description**: Lightweight heartbeat check.
  - **Response 200**:
    ```json
    {
      "status": "ok",
      "service": "TwinSense API",
      "timestamp": "2026-10-24T10:30:00.000Z"
    }
    ```

- **`GET /api/status`**
  - **Description**: Returns broker connection status, operating mode, active machine ID, and health score.

### Machines & Telemetry
- **`GET /api/machines`**
  - **Description**: Retrieves metadata of monitored industrial machines.

- **`GET /api/machines/{machine_id}/sensors/latest`**
  - **Description**: Current digital twin state, latest telemetry, ML predictions, and connection metadata.
  - **Response 200**:
    ```json
    {
      "machine_id": "MOTOR-001",
      "status": "NORMAL",
      "health_score": 94.2,
      "maintenance_risk": "LOW RISK",
      "anomaly_detected": false,
      "anomaly_score": 0.15,
      "data_source": "wokwi_esp32",
      "last_updated": "2026-10-24T10:30:10.000Z",
      "telemetry": {
        "temperature_c": 54.2,
        "humidity_percent": 42.0,
        "vibration_proxy": 0.34,
        "rpm": 1480,
        "load_percent": 55
      },
      "connection_status": {
        "iot_connected": true,
        "broker_connected": true,
        "backend_connected": true,
        "mode": "wokwi_esp32"
      }
    }
    ```

- **`GET /api/machines/{machine_id}/sensors/history?limit=50`**
  - **Description**: Chronological historical observations for chart visualization.

### Analytics & Machine Learning
- **`GET /api/analytics/anomalies?limit=30`**
  - **Description**: List of detected anomaly and warning alarm events.

- **`GET /api/analytics/model-metrics`**
  - **Description**: Evaluated metrics from holdout test split (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix, Feature Importance).

### Maintenance Work Orders
- **`GET /api/maintenance?status={pending|in_progress|resolved}`**
  - **Description**: Retrieves persistent maintenance task records.

- **`POST /api/maintenance`**
  - **Description**: Schedules a new maintenance work order.

- **`PATCH /api/maintenance/{task_id}`**
  - **Description**: Updates task status or appends technician resolution notes.
  - **Payload**:
    ```json
    {
      "status": "resolved",
      "resolution_notes": "Replaced drive-end bearing grease with synthetic lithium complex. Temperature stabilized at 54°C."
    }
    ```

### Simulation Controls
- **`POST /api/simulation/start`** — Resumes software simulation stream.
- **`POST /api/simulation/pause`** — Pauses simulation.
- **`POST /api/simulation/reset`** — Resets telemetry to nominal baseline.
- **`POST /api/simulation/scenario`** — Injects fault scenario (`normal`, `overheating`, `vibration`, `combined`).

---

## 2. WebSocket Protocol (`/ws/telemetry`)

Clients connect via standard WebSocket. The backend broadcasts incoming telemetry every 2 seconds:

```json
{
  "type": "telemetry_update",
  "data": { ...digital_twin_state... },
  "alert": null
}
```
If an abnormal threshold or Isolation Forest anomaly occurs, an `alert` object is appended for instant pop-up notification.
