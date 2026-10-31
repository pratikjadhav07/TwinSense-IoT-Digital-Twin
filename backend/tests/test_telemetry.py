import pytest
from app.schemas.telemetry import TelemetryPayload
from app.ml.inference import ml_engine
from app.simulator.fallback_simulator import fallback_simulator

def test_telemetry_schema_validation_valid():
    payload = {
        "machine_id": "MOTOR-001",
        "source": "wokwi_esp32",
        "temperature_c": 54.2,
        "humidity_percent": 42.0,
        "vibration_proxy": 0.34,
        "rpm": 1480,
        "load_percent": 55,
    }
    validated = TelemetryPayload(**payload)
    assert validated.machine_id == "MOTOR-001"
    assert validated.temperature_c == 54.2
    assert validated.rpm == 1480

def test_telemetry_schema_out_of_bounds():
    payload = {
        "machine_id": "MOTOR-001",
        "source": "wokwi_esp32",
        "temperature_c": 250.0, # Exceeds 150°C
        "humidity_percent": 42.0,
        "vibration_proxy": 0.34,
        "rpm": 1480,
        "load_percent": 55,
    }
    with pytest.raises(Exception):
        TelemetryPayload(**payload)

def test_ml_inference_nominal():
    # Nominal operating parameters
    result = ml_engine.predict(
        temperature_c=52.0,
        vibration_proxy=0.25,
        rpm=1485,
        load_percent=50
    )
    assert "anomaly_detected" in result
    assert "maintenance_risk" in result
    assert result["health_score"] >= 80.0

def test_ml_inference_fault_overheat():
    # Extreme overheating condition
    result = ml_engine.predict(
        temperature_c=86.0,
        vibration_proxy=0.35,
        rpm=1450,
        load_percent=80
    )
    assert result["health_score"] < 70.0
    assert result["maintenance_risk"] in ["ELEVATED RISK", "CRITICAL RISK"]

def test_fallback_simulator_scenarios():
    fallback_simulator.set_scenario("normal")
    r1 = fallback_simulator.generate_next_reading()
    assert r1["source"] == "software_fallback"
    assert r1["temperature_c"] < 65.0

    fallback_simulator.set_scenario("vibration")
    # Step forward
    for _ in range(15):
        r_vib = fallback_simulator.generate_next_reading()
    assert r_vib["vibration_proxy"] > 0.60
