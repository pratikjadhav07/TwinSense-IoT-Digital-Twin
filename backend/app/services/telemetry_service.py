import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Set
from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import TelemetryReading, AnomalyEvent, Machine
from app.schemas.telemetry import TelemetryPayload
from app.ml.inference import ml_engine

class TelemetryService:
    def __init__(self):
        # Reference to the main asyncio event loop (for thread-safe WS broadcast from MQTT)
        self.loop = None
        self.last_wokwi_time: float = 0.0

        # Active WebSocket connections
        self.active_websockets: Set[WebSocket] = set()
        
        # Latest machine digital twin cache
        self.latest_twin_states: Dict[str, Dict[str, Any]] = {
            "MOTOR-001": {
                "machine_id": "MOTOR-001",
                "name": "Main Induction Motor - Line 3",
                "type": "Three-Phase AC Induction (15 kW)",
                "status": "NORMAL",
                "health_score": 94.2,
                "maintenance_risk": "LOW RISK",
                "anomaly_detected": False,
                "anomaly_score": 0.15,
                "data_source": "system_init",
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "telemetry": {
                    "temperature_c": 52.4,
                    "humidity_percent": 42.0,
                    "vibration_proxy": 0.32,
                    "rpm": 1480,
                    "load_percent": 55,
                },
                "connection_status": {
                    "iot_connected": False,
                    "broker_connected": False,
                    "backend_connected": True,
                    "mode": "software_fallback",
                    "scenario": "normal",
                }
            }
        }

        # Alert deduplication tracker (stores active alert keys to prevent spamming)
        self.active_alert_keys: Set[str] = set()

    def is_wokwi_active(self) -> bool:
        """Returns True if a live Wokwi ESP32 packet was received within the last 60 seconds."""
        if self.last_wokwi_time == 0.0:
            return False
        return (time.time() - self.last_wokwi_time) < 60.0

    async def register_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        # Send initial snapshot immediately
        state = self.get_latest_state("MOTOR-001")
        try:
            await websocket.send_text(json.dumps({
                "type": "telemetry_update",
                "data": state
            }))
        except Exception:
            pass

    def unregister_websocket(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)

    async def broadcast_ws(self, payload: Dict[str, Any]):
        if not self.active_websockets:
            return
        msg = json.dumps(payload)
        dead = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.add(ws)
        self.active_websockets.difference_update(dead)

    def process_incoming_telemetry(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main pipeline: Validates telemetry -> Runs ML inference -> Evaluates rules -> Persists to DB -> Updates twin cache
        """
        # 1. Schema Validation
        payload = TelemetryPayload(**raw_data)
        machine_id = payload.machine_id

        # Check telemetry source: if Wokwi is sending data, prioritize it over fallback
        is_from_wokwi = (payload.source == "wokwi_esp32")
        if is_from_wokwi:
            self.last_wokwi_time = time.time()
        elif self.is_wokwi_active():
            # Wokwi is currently actively streaming! Discard software fallback data
            # so it never overwrites live Wokwi data.
            return self.get_latest_state(machine_id)

        # 2. Run Online ML Inference (Isolation Forest + Random Forest)
        ml_results = ml_engine.predict(
            temperature_c=payload.temperature_c,
            vibration_proxy=payload.vibration_proxy,
            rpm=payload.rpm,
            load_percent=payload.load_percent
        )

        # 3. Rule-Based Engineering Thresholds (co-existing with ML)
        rule_fault = None
        severity = "info"
        if payload.temperature_c >= 80.0 or payload.vibration_proxy >= 0.75:
            severity = "critical"
            rule_fault = f"Critical threshold exceeded (Temp: {payload.temperature_c}°C, Vib: {payload.vibration_proxy}g)"
        elif payload.temperature_c >= 65.0 or payload.vibration_proxy >= 0.50:
            severity = "warning"
            rule_fault = f"Advisory threshold exceeded (Temp: {payload.temperature_c}°C, Vib: {payload.vibration_proxy}g)"

        # 4. Status determination
        overall_status = "NORMAL"
        if severity == "critical" or ml_results["maintenance_risk"] == "CRITICAL RISK":
            overall_status = "CRITICAL"
        elif severity == "warning" or ml_results["maintenance_risk"] == "ELEVATED RISK" or ml_results["anomaly_detected"]:
            overall_status = "WARNING"

        # 5. Database Persistence with deduplication
        now = datetime.now(timezone.utc)
        new_alert = None
        db: Session = SessionLocal()
        try:
            # Insert Telemetry Reading
            db_reading = TelemetryReading(
                machine_id=machine_id,
                source=payload.source,
                temperature_c=payload.temperature_c,
                humidity_percent=payload.humidity_percent,
                vibration_proxy=payload.vibration_proxy,
                rpm=payload.rpm,
                load_percent=payload.load_percent,
                timestamp=now,
                status=overall_status
            )
            db.add(db_reading)

            # Check if Anomaly Alert needs creation (with deduplication)
            if overall_status != "NORMAL":
                alert_key = f"{machine_id}_{severity}_{overall_status}"
                if alert_key not in self.active_alert_keys:
                    self.active_alert_keys.add(alert_key)
                    alert_id = f"ALT-{int(now.timestamp()) % 10000}"
                    
                    is_ml = ml_results["anomaly_detected"]
                    prov = "Isolation Forest + Supervised Classifier" if is_ml else "Rule-Based Threshold"
                    
                    explanation = rule_fault or f"Isolation Forest identified outlier (score: {ml_results['anomaly_score']})"
                    rec = (
                        "Inspect motor cooling fan and clean ventilation shroud."
                        if payload.temperature_c > 65.0 else
                        "Inspect shaft alignment, coupling bolts, and bearing housing vibration."
                    )

                    anomaly_record = AnomalyEvent(
                        id=alert_id,
                        machine_id=machine_id,
                        timestamp=now,
                        anomaly_score=ml_results["anomaly_score"],
                        severity=severity,
                        rule_or_ml=prov,
                        title=f"{overall_status} Operating Alarm on {machine_id}",
                        explanation=explanation,
                        recommended_action=rec,
                        status="pending"
                    )
                    db.add(anomaly_record)
                    new_alert = {
                        "id": alert_id,
                        "machine_id": machine_id,
                        "timestamp": now.isoformat(),
                        "severity": severity,
                        "rule_or_ml": prov,
                        "title": anomaly_record.title,
                        "explanation": explanation,
                        "recommended_action": rec,
                        "status": "pending"
                    }
            else:
                # Clear active alerts if machine has stabilized back to normal
                self.active_alert_keys.clear()

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[DB INSERT ERROR] {e}")
        finally:
            db.close()

        # 6. Update in-memory digital twin snapshot
        iot_active = is_from_wokwi or self.is_wokwi_active()
        twin_state = {
            "machine_id": machine_id,
            "name": "Main Induction Motor - Line 3",
            "type": "Three-Phase AC Induction (15 kW)",
            "status": overall_status,
            "health_score": ml_results["health_score"],
            "maintenance_risk": ml_results["maintenance_risk"],
            "risk_probabilities": ml_results.get("risk_probabilities", {}),
            "anomaly_detected": ml_results["anomaly_detected"],
            "anomaly_score": ml_results["anomaly_score"],
            "data_source": payload.source,
            "last_updated": now.isoformat(),
            "telemetry": {
                "temperature_c": payload.temperature_c,
                "humidity_percent": payload.humidity_percent,
                "vibration_proxy": payload.vibration_proxy,
                "rpm": payload.rpm,
                "load_percent": payload.load_percent,
            },
            "connection_status": {
                "iot_connected": iot_active,
                "broker_connected": True,
                "backend_connected": True,
                "mode": "wokwi_esp32" if iot_active else "software_fallback",
            }
        }
        self.latest_twin_states[machine_id] = twin_state

        # 7. Asynchronously broadcast to WebSocket clients (thread-safe from MQTT background thread)
        ws_payload = {
            "type": "telemetry_update",
            "data": twin_state,
            "alert": new_alert
        }
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast_ws(ws_payload), self.loop)
        else:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self.broadcast_ws(ws_payload))
            except RuntimeError:
                pass

        return twin_state

    def get_latest_state(self, machine_id: str = "MOTOR-001") -> Dict[str, Any]:
        return self.latest_twin_states.get(machine_id, self.latest_twin_states["MOTOR-001"])

telemetry_service = TelemetryService()
