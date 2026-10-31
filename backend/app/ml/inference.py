import os
import json
import joblib
import warnings
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Suppress sklearn parallel/delayed worker warnings during real-time online inference
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
ISO_PATH = os.path.join(MODELS_DIR, "isolation_forest.joblib")
RF_PATH = os.path.join(MODELS_DIR, "random_forest.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

class ModelEngine:
    def __init__(self):
        self.iso_forest = None
        self.rf_classifier = None
        self.metrics_cache = None
        self._load_models()

    def _load_models(self):
        try:
            if os.path.exists(ISO_PATH) and os.path.exists(RF_PATH):
                self.iso_forest = joblib.load(ISO_PATH)
                self.rf_classifier = joblib.load(RF_PATH)
                # Single-sample online inference does not need multi-core worker pools
                if hasattr(self.iso_forest, "set_params"):
                    self.iso_forest.set_params(n_jobs=1)
                if hasattr(self.rf_classifier, "set_params"):
                    self.rf_classifier.set_params(n_jobs=1)
                print("[ML ENGINE] Successfully loaded Isolation Forest & Random Forest models (n_jobs=1).")
            else:
                print("[ML ENGINE] Model artifacts not found. Please run train.py first.")

            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r") as f:
                    self.metrics_cache = json.load(f)
        except Exception as e:
            print(f"[ML ENGINE ERROR] Failed to load models: {e}")

    def predict(
        self,
        temperature_c: float,
        vibration_proxy: float,
        rpm: int,
        load_percent: int
    ) -> Dict[str, Any]:
        """
        Runs online inference on live telemetry inputs.
        """
        slip_rpm = 1500 - rpm
        features = pd.DataFrame([{
            "temperature_c": float(temperature_c),
            "vibration_proxy": float(vibration_proxy),
            "rpm": int(rpm),
            "load_percent": int(load_percent),
            "slip_rpm": int(slip_rpm),
        }])

        # Default fallback results if models are not loaded
        if self.iso_forest is None or self.rf_classifier is None:
            # Rule fallback
            is_anomaly = temperature_c > 75.0 or vibration_proxy > 0.70
            return {
                "anomaly_detected": is_anomaly,
                "anomaly_score": -0.35 if is_anomaly else 0.15,
                "maintenance_risk": "CRITICAL RISK" if is_anomaly else "LOW RISK",
                "risk_probabilities": {"Normal": 0.8, "Elevated Risk": 0.15, "Critical Condition": 0.05},
                "health_score": 60.0 if is_anomaly else 94.0,
                "model_available": False,
            }

        # 1. Unsupervised Anomaly Detection
        # decision_function: lower means more abnormal; threshold roughly 0.0
        anomaly_score = float(self.iso_forest.decision_function(features)[0])
        # predict: -1 for outlier/anomaly, 1 for inlier
        iso_pred = int(self.iso_forest.predict(features)[0])
        anomaly_detected = (iso_pred == -1 or anomaly_score < 0.0)

        # 2. Supervised Risk Classification
        risk_class = str(self.rf_classifier.predict(features)[0])
        probs = self.rf_classifier.predict_proba(features)[0]
        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(self.rf_classifier.classes_, probs)
        }

        # Map to display nomenclature
        risk_label = "LOW RISK"
        if risk_class == "Critical Condition":
            risk_label = "CRITICAL RISK"
        elif risk_class == "Elevated Risk":
            risk_label = "ELEVATED RISK"

        # 3. Dynamic Machine Health Score (0 - 100)
        # Baseline 100, penalized by thermal deviation, vibration RMS, and anomaly score
        temp_penalty = max(0.0, (temperature_c - 55.0) * 1.2)
        vib_penalty = max(0.0, (vibration_proxy - 0.35) * 50.0)
        anomaly_penalty = 25.0 if anomaly_detected else 0.0
        health_score = max(10.0, min(100.0, 100.0 - temp_penalty - vib_penalty - anomaly_penalty))

        return {
            "anomaly_detected": anomaly_detected,
            "anomaly_score": round(anomaly_score, 4),
            "maintenance_risk": risk_label,
            "risk_class": risk_class,
            "risk_probabilities": prob_dict,
            "health_score": round(float(health_score), 1),
            "model_available": True,
        }

    def get_metrics(self) -> Dict[str, Any]:
        if self.metrics_cache:
            return self.metrics_cache
        return {"error": "Model metrics not available. Run train.py."}

ml_engine = ModelEngine()
