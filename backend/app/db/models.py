from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean, Index
from app.db.session import Base

class Machine(Base):
    __tablename__ = "machines"

    machine_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(100), default="Three-Phase AC Induction (15 kW)")
    rated_rpm = Column(Integer, default=1500)
    rated_temp_c = Column(Float, default=65.0)
    max_temp_c = Column(Float, default=85.0)
    max_vibration_proxy = Column(Float, default=0.80)
    status = Column(String(30), default="NORMAL")
    created_at = Column(DateTime, default=datetime.utcnow)

class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), index=True, nullable=False)
    source = Column(String(50), nullable=False) # 'wokwi_esp32' | 'software_fallback'
    temperature_c = Column(Float, nullable=False)
    humidity_percent = Column(Float, nullable=False)
    vibration_proxy = Column(Float, nullable=False)
    rpm = Column(Integer, nullable=False)
    load_percent = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(30), default="NORMAL")

    __table_args__ = (
        Index("idx_machine_timestamp", "machine_id", "timestamp"),
    )

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(String(50), primary_key=True, index=True)
    machine_id = Column(String(50), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    anomaly_score = Column(Float, default=0.0)
    severity = Column(String(30), default="warning") # 'info' | 'warning' | 'critical'
    rule_or_ml = Column(String(100), default="Rule-Based")
    title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(30), default="pending") # 'pending' | 'acknowledged' | 'resolved'
    acknowledged_by = Column(String(100), nullable=True)

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id = Column(String(50), primary_key=True, index=True)
    machine_id = Column(String(50), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    title = Column(String(200), nullable=False)
    severity = Column(String(30), default="medium") # 'low' | 'medium' | 'high'
    status = Column(String(30), default="pending") # 'pending' | 'in_progress' | 'resolved'
    triggering_fault = Column(String(200), nullable=False)
    assigned_technician = Column(String(100), default="Unassigned")
    recommendation = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
