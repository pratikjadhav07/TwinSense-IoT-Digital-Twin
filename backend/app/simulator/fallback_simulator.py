import time
import math
import random
from datetime import datetime
from typing import Dict, Any, Optional

class FallbackSimulator:
    def __init__(self, machine_id: str = "MOTOR-001"):
        self.machine_id = machine_id
        self.is_running = True
        self.scenario = "normal" # 'normal' | 'overheating' | 'vibration' | 'combined'
        self.step_counter = 0

    def set_scenario(self, scenario: str):
        valid = ["normal", "overheating", "vibration", "combined"]
        if scenario in valid:
            self.scenario = scenario
            self.step_counter = 0

    def generate_next_reading(self) -> Dict[str, Any]:
        self.step_counter += 1
        now = datetime.utcnow()
        sine_var = math.sin(self.step_counter * 0.3) * 1.2

        if self.scenario == "normal":
            temp = 52.4 + sine_var + random.uniform(-0.5, 0.5)
            hum = 42.0 + math.cos(self.step_counter * 0.2)
            vib = 0.30 + abs(math.sin(self.step_counter * 0.5)) * 0.08
            load = 55 + int(sine_var * 2)
            slip = 16.0 + (load * 0.12)
            rpm = int(round(1500 - slip + random.uniform(-2, 2)))
            status = "NORMAL"

        elif self.scenario == "overheating":
            # Progressively heats up towards 82°C
            progress = min(1.0, self.step_counter / 15.0)
            temp = 55.0 + (progress * 28.0) + random.uniform(-0.8, 0.8)
            hum = max(20.0, 42.0 - (progress * 15.0))
            vib = 0.35 + random.uniform(0, 0.05)
            load = 75 + int(progress * 10)
            slip = 25.0 + (progress * 15.0)
            rpm = int(round(1500 - slip))
            status = "CRITICAL" if temp >= 80.0 else "WARNING"

        elif self.scenario == "vibration":
            # Vibration surges past 0.75g
            progress = min(1.0, self.step_counter / 12.0)
            temp = 58.0 + (progress * 6.0)
            hum = 41.5
            vib = 0.35 + (progress * 0.52) + random.uniform(-0.03, 0.03)
            load = 70 + int(progress * 15)
            slip = 22.0 + (vib * 55.0)
            rpm = int(round(1500 - slip))
            status = "CRITICAL" if vib >= 0.75 else "WARNING"

        else: # combined fault
            progress = min(1.0, self.step_counter / 10.0)
            temp = 60.0 + (progress * 24.0) + random.uniform(-1, 1)
            hum = 30.0
            vib = 0.40 + (progress * 0.50) + random.uniform(0, 0.06)
            load = 85 + int(progress * 12)
            slip = 35.0 + (vib * 60.0)
            rpm = int(round(1500 - slip))
            status = "CRITICAL"

        return {
            "machine_id": self.machine_id,
            "source": "software_fallback",
            "temperature_c": round(float(temp), 1),
            "humidity_percent": round(float(hum), 1),
            "vibration_proxy": round(float(vib), 2),
            "rpm": int(rpm),
            "load_percent": int(load),
            "timestamp": now.isoformat(),
            "status": status,
        }

fallback_simulator = FallbackSimulator()
