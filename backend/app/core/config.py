from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TwinSense: IoT Digital Twin Backend"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # MQTT Settings
    MQTT_BROKER: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883
    MQTT_USER: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_CLIENT_ID: str = "twinsense_fastapi_backend"
    MQTT_TOPIC_TELEMETRY: str = "twinsense/+/telemetry"
    MQTT_TOPIC_STATUS: str = "twinsense/+/status"
    MQTT_TOPIC_COMMANDS: str = "twinsense/{machine_id}/commands"
    MQTT_KEEPALIVE: int = 60

    # Persistence
    DATABASE_URL: str = "sqlite:///./twinsense.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    # Simulation Default Modes: 'wokwi_esp32' or 'software_fallback'
    DEFAULT_SIMULATION_MODE: str = "software_fallback"
    FALLBACK_INTERVAL_SEC: float = 2.0

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
