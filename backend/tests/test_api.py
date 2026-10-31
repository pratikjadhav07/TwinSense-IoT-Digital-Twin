from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db

# Initialize database schema and fixtures for testing
init_db()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "TwinSense API"

def test_system_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "broker_connected" in data
    assert "health_score" in data

def test_machines_endpoint():
    response = client.get("/api/machines")
    assert response.status_code == 200
    machines = response.json()
    assert len(machines) >= 1
    assert machines[0]["machine_id"] == "MOTOR-001"

def test_sensor_latest():
    response = client.get("/api/machines/MOTOR-001/sensors/latest")
    assert response.status_code == 200
    twin = response.json()
    assert twin["machine_id"] == "MOTOR-001"
    assert "telemetry" in twin

def test_model_metrics():
    response = client.get("/api/analytics/model-metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert "metrics" in metrics
    assert "accuracy" in metrics["metrics"]

def test_simulation_controls():
    # Pause simulation
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["simulation_running"] is False

    # Start simulation
    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200
    assert res_start.json()["simulation_running"] is True

    # Scenario switch
    res_scen = client.post("/api/simulation/scenario", json={"scenario": "overheating"})
    assert res_scen.status_code == 200
    assert res_scen.json()["scenario"] == "overheating"

def test_custom_reading_injection():
    payload = {
        "machine_id": "MOTOR-001",
        "source": "test_injector",
        "temperature_c": 72.5,
        "humidity_percent": 38.0,
        "vibration_proxy": 0.58,
        "rpm": 1420,
        "load_percent": 75,
    }
    response = client.post("/api/simulation/custom-reading", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["processed_state"]["telemetry"]["temperature_c"] == 72.5
