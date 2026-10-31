from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class MaintenanceTaskCreate(BaseModel):
    machine_id: str = Field(..., json_schema_extra={"example": "MOTOR-001"})
    title: str = Field(..., json_schema_extra={"example": "Inspect drive-end bearing lubrication"})
    severity: str = Field(default="medium", json_schema_extra={"example": "high"})
    triggering_fault: str = Field(..., json_schema_extra={"example": "High vibration proxy anomaly"})
    assigned_technician: Optional[str] = Field(default="Unassigned")
    recommendation: str = Field(..., json_schema_extra={"example": "Check grease condition and bearing housing temperature."})

class MaintenanceTaskUpdate(BaseModel):
    status: Optional[str] = Field(None, json_schema_extra={"example": "resolved"}) # 'pending' | 'in_progress' | 'resolved'
    resolution_notes: Optional[str] = Field(None, json_schema_extra={"example": "Bearing inspected and synthetic grease replenished."})
    assigned_technician: Optional[str] = None

class MaintenanceTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: str
    machine_id: str
    created_at: datetime
    title: str
    severity: str
    status: str
    triggering_fault: str
    assigned_technician: str
    recommendation: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
