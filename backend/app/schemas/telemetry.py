from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class TelemetryPayload(BaseModel):
    machine_id: str = Field(..., json_schema_extra={"example": "MOTOR-001"})
    source: str = Field(default="wokwi_esp32", json_schema_extra={"example": "wokwi_esp32"})
    temperature_c: float = Field(..., ge=-20.0, le=150.0, json_schema_extra={"example": 54.2})
    humidity_percent: float = Field(..., ge=0.0, le=100.0, json_schema_extra={"example": 42.0})
    vibration_proxy: float = Field(..., ge=0.0, le=5.0, json_schema_extra={"example": 0.34})
    rpm: int = Field(..., ge=0, le=3600, json_schema_extra={"example": 1480})
    load_percent: int = Field(..., ge=0, le=150, json_schema_extra={"example": 55})
    timestamp_ms: Optional[int] = None
    timestamp: Optional[datetime] = None
    status: Optional[str] = "NORMAL"

class TelemetryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: str
    source: str
    temperature_c: float
    humidity_percent: float
    vibration_proxy: float
    rpm: int
    load_percent: int
    timestamp: datetime
    status: str

class MachineStatusSummary(BaseModel):
    machine_id: str
    name: str
    status: str
    health_score: float
    maintenance_risk: str
    anomaly_detected: bool
    anomaly_score: float
    data_source: str
    last_updated: datetime
    telemetry: Dict[str, Any]
    connection_status: Dict[str, Any]

class AnomalyEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    machine_id: str
    timestamp: datetime
    anomaly_score: float
    severity: str
    rule_or_ml: str
    title: str
    explanation: str
    recommended_action: str
    status: str
    acknowledged_by: Optional[str] = None
