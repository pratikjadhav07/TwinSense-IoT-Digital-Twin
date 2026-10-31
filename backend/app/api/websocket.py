import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.telemetry_service import telemetry_service

router = APIRouter()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await telemetry_service.register_websocket(websocket)
    try:
        while True:
            # Keep alive and listen for client commands (e.g. ping or scenario change)
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                if data.get("action") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        telemetry_service.unregister_websocket(websocket)
    except Exception as e:
        telemetry_service.unregister_websocket(websocket)
