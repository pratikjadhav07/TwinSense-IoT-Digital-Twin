from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import Machine, TelemetryReading, AnomalyEvent, MaintenanceTask
from app.schemas.telemetry import TelemetryPayload, TelemetryResponse, AnomalyEventSchema
from app.schemas.maintenance import MaintenanceTaskCreate, MaintenanceTaskUpdate, MaintenanceTaskResponse
from app.services.telemetry_service import telemetry_service
from app.services.mqtt_client import mqtt_consumer
from app.simulator.fallback_simulator import fallback_simulator
from app.ml.inference import ml_engine

router = APIRouter()

# --- 1. Health & System Status ---
@router.get("/health")
def health_check():
    """Lightweight health check endpoint"""
    return {
        "status": "ok",
        "service": "TwinSense API",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status")
def system_status():
    """Reports global IoT broker, backend, and machine twin state"""
    twin = telemetry_service.get_latest_state("MOTOR-001")
    return {
        "broker_connected": mqtt_consumer.is_connected,
        "mqtt_last_message": mqtt_consumer.last_message_time,
        "active_ws_clients": len(telemetry_service.active_websockets),
        "machine_id": twin["machine_id"],
        "data_source": twin["data_source"],
        "operating_mode": twin["connection_status"]["mode"],
        "simulation_running": fallback_simulator.is_running,
        "simulation_scenario": fallback_simulator.scenario,
        "health_score": twin["health_score"],
        "maintenance_risk": twin["maintenance_risk"],
    }

# --- 2. Machines Metadata ---
@router.get("/machines")
def get_machines(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    if not machines:
        # Return default machine if DB was just initialized
        return [{
            "machine_id": "MOTOR-001",
            "name": "Main Induction Motor - Line 3",
            "type": "Three-Phase AC Induction (15 kW)",
            "status": "NORMAL",
            "rated_rpm": 1500,
            "rated_temp_c": 65.0,
            "max_temp_c": 85.0,
            "max_vibration_proxy": 0.80,
        }]
    return machines

@router.get("/machines/{machine_id}")
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        twin = telemetry_service.get_latest_state(machine_id)
        return {
            "machine_id": machine_id,
            "name": twin.get("name", "Three-Phase Induction Motor"),
            "status": twin.get("status", "NORMAL"),
        }
    return machine

# --- 3. Telemetry Endpoints ---
@router.get("/machines/{machine_id}/sensors/latest")
def get_latest_telemetry(machine_id: str):
    return telemetry_service.get_latest_state(machine_id)

@router.get("/machines/{machine_id}/sensors/history")
def get_telemetry_history(
    machine_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    readings = (
        db.query(TelemetryReading)
        .filter(TelemetryReading.machine_id == machine_id)
        .order_by(desc(TelemetryReading.timestamp))
        .limit(limit)
        .all()
    )
    # Return chronologically ascending for charts
    return list(reversed(readings))

# --- 4. Analytics & ML Endpoints ---
@router.get("/analytics/anomalies", response_model=List[AnomalyEventSchema])
def get_anomalies(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return (
        db.query(AnomalyEvent)
        .order_by(desc(AnomalyEvent.timestamp))
        .limit(limit)
        .all()
    )

@router.get("/analytics/predictions")
def get_current_prediction(machine_id: str = "MOTOR-001"):
    twin = telemetry_service.get_latest_state(machine_id)
    telemetry = twin["telemetry"]
    pred = ml_engine.predict(
        temperature_c=telemetry["temperature_c"],
        vibration_proxy=telemetry["vibration_proxy"],
        rpm=telemetry["rpm"],
        load_percent=telemetry["load_percent"]
    )
    return {
        "machine_id": machine_id,
        "timestamp": twin["last_updated"],
        "prediction": pred,
        "input_features": telemetry,
    }

@router.get("/analytics/model-metrics")
def get_model_metrics():
    return ml_engine.get_metrics()

# --- 5. Maintenance Management ---
@router.get("/maintenance", response_model=List[MaintenanceTaskResponse])
def get_maintenance_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceTask)
    if status and status != "all":
        query = query.filter(MaintenanceTask.status == status)
    return query.order_by(desc(MaintenanceTask.created_at)).all()

@router.post("/maintenance", response_model=MaintenanceTaskResponse)
def create_maintenance_task(task_in: MaintenanceTaskCreate, db: Session = Depends(get_db)):
    task_id = f"TASK-{int(datetime.utcnow().timestamp()) % 10000}"
    task = MaintenanceTask(
        task_id=task_id,
        machine_id=task_in.machine_id,
        title=task_in.title,
        severity=task_in.severity,
        triggering_fault=task_in.triggering_fault,
        assigned_technician=task_in.assigned_technician or "Unassigned",
        recommendation=task_in.recommendation,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/maintenance/{task_id}", response_model=MaintenanceTaskResponse)
def update_maintenance_task(
    task_id: str,
    task_update: MaintenanceTaskUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    if task_update.status:
        task.status = task_update.status
        if task_update.status == "resolved":
            task.resolved_at = datetime.utcnow()
    if task_update.resolution_notes:
        task.resolution_notes = task_update.resolution_notes
    if task_update.assigned_technician:
        task.assigned_technician = task_update.assigned_technician

    db.commit()
    db.refresh(task)
    return task

# --- 6. Simulation & Control ---
@router.post("/simulation/start")
def start_simulation():
    fallback_simulator.is_running = True
    return {"status": "success", "simulation_running": True}

@router.post("/simulation/pause")
def pause_simulation():
    fallback_simulator.is_running = False
    return {"status": "success", "simulation_running": False}

@router.post("/simulation/reset")
def reset_simulation():
    fallback_simulator.scenario = "normal"
    fallback_simulator.step_counter = 0
    return {"status": "success", "scenario": "normal"}

@router.post("/simulation/scenario")
def set_scenario(scenario: str = Body(..., embed=True)):
    fallback_simulator.is_running = True
    fallback_simulator.set_scenario(scenario)
    return {"status": "success", "scenario": scenario}

@router.post("/simulation/custom-reading")
def inject_custom_reading(payload: TelemetryPayload):
    """Allows manual injection of verified telemetry reading"""
    result = telemetry_service.process_incoming_telemetry(payload.model_dump())
    return {"status": "success", "processed_state": result}
