from datetime import datetime, timedelta
from app.db.session import engine, Base, SessionLocal
from app.db.models import Machine, TelemetryReading, AnomalyEvent, MaintenanceTask

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if Machine exists
        motor = db.query(Machine).filter(Machine.machine_id == "MOTOR-001").first()
        if not motor:
            motor = Machine(
                machine_id="MOTOR-001",
                name="Main Induction Motor - Line 3",
                type="Three-Phase AC Induction (15 kW)",
                rated_rpm=1500,
                rated_temp_c=65.0,
                max_temp_c=85.0,
                max_vibration_proxy=0.80,
                status="NORMAL",
                created_at=datetime.utcnow()
            )
            db.add(motor)

        # Seed initial maintenance task if none exist
        if db.query(MaintenanceTask).count() == 0:
            now = datetime.utcnow()
            task1 = MaintenanceTask(
                task_id="TASK-401",
                machine_id="MOTOR-001",
                title="Front Drive-End Bearing Greasing & Alignment",
                severity="high",
                status="in_progress",
                triggering_fault="High Vibration Proxy Anomaly (ALT-1081)",
                assigned_technician="Alex Rivera (Vibration Level II)",
                recommendation="Inspect bearing housing temperature, check grease condition for metallic particles, re-torque mounting bolts.",
                resolution_notes="Inspected drive-end coupling; bearing temperature stabilized at 56°C. Grease replenished with synthetic lithium complex.",
                created_at=now - timedelta(hours=3)
            )
            task2 = MaintenanceTask(
                task_id="TASK-398",
                machine_id="MOTOR-001",
                title="Stator Air Filter & Ventilation Fan Cleaning",
                severity="medium",
                status="resolved",
                triggering_fault="Thermal dissipation degradation warning",
                assigned_technician="Priya Sharma",
                recommendation="Blow out cooling cowl with dry compressed air; verify fan impellers are intact.",
                resolution_notes="Cowl cleared of dust accumulation. Free airflow restored. Temperature delta dropped 6°C.",
                created_at=now - timedelta(days=1),
                resolved_at=now - timedelta(hours=18)
            )
            db.add_all([task1, task2])

        db.commit()
        print("[DATABASE] Schema initialized and seeded.")
    except Exception as e:
        db.rollback()
        print(f"[DATABASE INIT ERROR] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
