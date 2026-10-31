import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)
from sklearn.preprocessing import label_binarize

from app.ml.synthetic_data import generate_motor_dataset

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

def train_and_evaluate_models():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("=" * 60)
    print("  TwinSense ML Pipeline: Model Training & Evaluation")
    print("=" * 60)

    # 1. Generate Training Dataset (N=10,000)
    print("\n[DATA] Generating 10,000 synthetic motor operational samples...")
    df = generate_motor_dataset(n_samples=10000, random_seed=42)

    feature_cols = ["temperature_c", "vibration_proxy", "rpm", "load_percent"]
    X = df[feature_cols].copy()
    y = df["maintenance_risk"].copy()

    # Add derived feature: Slip RPM
    X["slip_rpm"] = 1500 - X["rpm"]

    # 2. Train Unsupervised Isolation Forest Anomaly Detector
    print("[TRAINING] Training Isolation Forest (contamination=0.05)...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X)
    iso_model_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
    joblib.dump(iso_forest, iso_model_path)
    print(f" -> Saved Isolation Forest artifact to: {iso_model_path}")

    # 3. Supervised Train / Test Split (80% Train, 20% Test)
    print("\n[TRAINING] Splitting data into 80% Train / 20% Holdout Test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 4. Train Supervised Random Forest Classifier
    print("[TRAINING] Training Random Forest Maintenance Risk Classifier...")
    rf_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )
    rf_classifier.fit(X_train, y_train)
    rf_model_path = os.path.join(MODELS_DIR, "random_forest.joblib")
    joblib.dump(rf_classifier, rf_model_path)
    print(f" -> Saved Random Forest artifact to: {rf_model_path}")

    # 5. Evaluate on 20% Holdout Test Set
    print("\n[EVALUATION] Calculating holdout test set performance...")
    y_pred = rf_classifier.predict(X_test)
    y_proba = rf_classifier.predict_proba(X_test)

    classes = rf_classifier.classes_.tolist()
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="macro")
    rec = recall_score(y_test, y_pred, average="macro")
    f1 = f1_score(y_test, y_pred, average="macro")

    # Multi-class ROC-AUC (One-vs-Rest)
    y_test_bin = label_binarize(y_test, classes=classes)
    roc_auc = roc_auc_score(y_test_bin, y_proba, multi_class="ovr")

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    formatted_cm = []
    for i, actual_class in enumerate(classes):
        row = {"actual": actual_class}
        for j, pred_class in enumerate(classes):
            row[f"pred_{pred_class.lower().replace(' ', '_')}"] = int(cm[i][j])
        formatted_cm.append(row)

    # Feature Importances
    feat_importances = []
    for col, imp in zip(X.columns, rf_classifier.feature_importances_):
        feat_importances.append({
            "feature": col.replace("_", " ").title(),
            "importance": round(float(imp), 4)
        })
    feat_importances = sorted(feat_importances, key=lambda x: x["importance"], reverse=True)

    metrics_payload = {
        "model_name": "RandomForestClassifier",
        "version": "1.0.0",
        "dataset_samples": len(df),
        "test_samples": len(X_test),
        "classes": classes,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
        },
        "confusion_matrix": formatted_cm,
        "feature_importance": feat_importances,
        "isolation_forest_contamination": 0.05,
    }

    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f" -> Saved Model Metrics JSON to: {metrics_path}")

    print("\n--- Model Evaluation Summary ---")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc * 100:.2f}%")
    print("=" * 60)

    return metrics_payload

if __name__ == "__main__":
    train_and_evaluate_models()
