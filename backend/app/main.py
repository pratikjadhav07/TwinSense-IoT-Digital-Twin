import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.db.init_db import init_db
from app.api.endpoints import router as api_router
from app.api.websocket import router as ws_router
from app.services.mqtt_client import mqtt_consumer
from app.services.telemetry_service import telemetry_service
from app.simulator.fallback_simulator import fallback_simulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TwinSense.Main")

# Background simulation runner
simulation_task = None

async def run_fallback_simulation():
    """
    Background worker:
    Generates telemetry periodically in Software Fallback mode (Mode 2)
    ONLY when Wokwi ESP32 is not sending live packets.
    """
    logger.info("[SIMULATION ENGINE] Software Fallback Simulation Task started.")
    while True:
        try:
            # Only run fallback simulation if Wokwi is NOT actively streaming
            if fallback_simulator.is_running and not telemetry_service.is_wokwi_active():
                reading = fallback_simulator.generate_next_reading()
                telemetry_service.process_incoming_telemetry(reading)

            await asyncio.sleep(settings.FALLBACK_INTERVAL_SEC)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[SIMULATION TASK ERROR] {e}")
            await asyncio.sleep(settings.FALLBACK_INTERVAL_SEC)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 0. Store reference to the main asyncio event loop for thread-safe WS broadcast
    telemetry_service.loop = asyncio.get_running_loop()

    # 1. Initialize Database
    init_db()

    # 2. Start MQTT Consumer
    mqtt_consumer.start()

    # 3. Start Software Fallback Simulation background worker
    global simulation_task
    simulation_task = asyncio.create_task(run_fallback_simulation())

    yield

    # Teardown
    if simulation_task:
        simulation_task.cancel()
    mqtt_consumer.stop()
    logger.info("[LIFECYCLE] TwinSense backend shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack IoT Digital Twin for Predictive Maintenance REST & WebSocket Engine",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "project": "TwinSense: IoT Digital Twin for Predictive Maintenance",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
        "websocket": "/ws/telemetry",
        "version": settings.VERSION
    }
