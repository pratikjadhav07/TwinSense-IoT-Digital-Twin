import json
import logging
import time
import uuid
import paho.mqtt.client as mqtt
from app.core.config import settings
from app.services.telemetry_service import telemetry_service
from app.simulator.fallback_simulator import fallback_simulator

logger = logging.getLogger("TwinSense.MQTT")

class MQTTConsumer:
    def __init__(self):
        # Generate unique client ID to avoid broker collisions on public HiveMQ
        unique_id = f"{settings.MQTT_CLIENT_ID}_{uuid.uuid4().hex[:6]}"
        try:
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=unique_id,
                protocol=mqtt.MQTTv311
            )
        except AttributeError:
            self.client = mqtt.Client(client_id=unique_id, protocol=mqtt.MQTTv311)

        if settings.MQTT_USER and settings.MQTT_PASSWORD:
            self.client.username_pw_set(settings.MQTT_USER, settings.MQTT_PASSWORD)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

        self.is_connected = False
        self.last_message_time = None

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        rc_code = rc.value if hasattr(rc, "value") else rc
        if rc_code == 0:
            self.is_connected = True
            print(f"[MQTT] Connected successfully to broker: {settings.MQTT_BROKER}:{settings.MQTT_PORT}")
            # Subscribe to telemetry topic
            client.subscribe(settings.MQTT_TOPIC_TELEMETRY, qos=0)
            print(f"[MQTT] Subscribed to topic: {settings.MQTT_TOPIC_TELEMETRY}")
        else:
            self.is_connected = False
            print(f"[MQTT ERROR] Connection failed with result code: {rc_code}")

    def _on_disconnect(self, client, userdata, flags_or_rc, rc_or_props=None, properties=None):
        self.is_connected = False
        rc = rc_or_props if rc_or_props is not None else flags_or_rc
        print(f"[MQTT] Disconnected from broker (rc={rc}). Auto-reconnection enabled.")

    def _on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload_str = msg.payload.decode("utf-8")
            self.last_message_time = time.time()

            # Handle Telemetry topic
            if "/telemetry" in topic:
                data = json.loads(payload_str)
                source = data.get("source", "wokwi_esp32")
                machine_id = data.get("machine_id", "MOTOR-001")
                temp = data.get("temperature_c")
                vib = data.get("vibration_proxy")
                rpm = data.get("rpm")
                load = data.get("load_percent")
                print(f"[MQTT RX from {source.upper()}] {machine_id} -> Temp: {temp}°C | Vib: {vib}g | RPM: {rpm} | Load: {load}%")

                # Dispatch to telemetry service
                telemetry_service.process_incoming_telemetry(data)
                
                # Live Wokwi ESP32 is active: pause software fallback simulator so it never overwrites Wokwi
                fallback_simulator.is_running = False
                if machine_id in telemetry_service.latest_twin_states:
                    telemetry_service.latest_twin_states[machine_id]["connection_status"]["iot_connected"] = True
                    telemetry_service.latest_twin_states[machine_id]["connection_status"]["broker_connected"] = True
                    telemetry_service.latest_twin_states[machine_id]["connection_status"]["mode"] = "wokwi_esp32"

            elif "/status" in topic:
                status_doc = json.loads(payload_str)
                machine_id = status_doc.get("machine_id", "MOTOR-001")
                node_status = status_doc.get("status", "UNKNOWN")
                print(f"[MQTT STATUS] Node {machine_id} status reported: {node_status}")
                if machine_id in telemetry_service.latest_twin_states and node_status == "OFFLINE":
                    telemetry_service.latest_twin_states[machine_id]["connection_status"]["iot_connected"] = False

        except json.JSONDecodeError as err:
            print(f"[MQTT WARNING] Malformed JSON payload received: {err}")
        except Exception as err:
            print(f"[MQTT ERROR] Failed processing message: {err}")

    def start(self):
        try:
            print(f"[MQTT] Connecting to {settings.MQTT_BROKER}:{settings.MQTT_PORT}...")
            self.client.connect_async(
                settings.MQTT_BROKER,
                settings.MQTT_PORT,
                keepalive=settings.MQTT_KEEPALIVE
            )
            self.client.loop_start()
        except Exception as e:
            print(f"[MQTT INIT WARNING] Could not start MQTT client: {e}. Falling back to software mode.")

    def stop(self):
        try:
            self.client.loop_stop()
            self.client.disconnect()
            print("[MQTT] Stopped client loop.")
        except Exception:
            pass

    def publish_command(self, machine_id: str, command: str, extra: dict = None):
        if not self.is_connected:
            return False
        topic = settings.MQTT_TOPIC_COMMANDS.format(machine_id=machine_id)
        payload = {"command": command, "timestamp": time.time()}
        if extra:
            payload.update(extra)
        res = self.client.publish(topic, json.dumps(payload), qos=1)
        return res.rc == mqtt.MQTT_ERR_SUCCESS

mqtt_consumer = MQTTConsumer()
