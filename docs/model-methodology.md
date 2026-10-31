# TwinSense — Machine Learning Pipeline & Methodology

## 1. Objectives & Architectural Separation

TwinSense implements two genuinely independent machine learning paradigms:
1. **Unsupervised Anomaly Detection**: Identifies subtle multi-dimensional outliers in telemetry feature space without relying on ground-truth labels.
2. **Supervised Maintenance-Risk Classification**: Categorizes operational regimes into actionable maintenance states based on motor degradation physics.

---

## 2. Unsupervised Model: Isolation Forest

- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Contamination Assumption**: `0.05` (5% expected baseline anomalies in continuous industrial operation).
- **Features Used**:
  1. Stator Core Temperature (`temperature_c`)
  2. Multi-axis Vibration Proxy (`vibration_proxy`)
  3. Rotor Velocity (`rpm`)
  4. Operational Load (`load_percent`)
  5. Synchronous Slip Velocity (`slip_rpm = 1500 - rpm`)
- **Mathematical Principle**: Anomalous states require fewer random recursive partitions (shorter tree paths) to be isolated than nominal operating clusters.
- **Decision Boundary**: Scores `< 0.00` indicate high isolation depth anomalies.

---

## 3. Supervised Model: Random Forest Risk Classifier

- **Algorithm**: `sklearn.ensemble.RandomForestClassifier` (100 estimators, max depth 10, balanced class weighting).
- **Target Classes**:
  - `Normal`: Nominal operation, no maintenance intervention required.
  - `Elevated Risk`: Incipient thermal degradation, mild vibration, or abnormal slip; schedule routine inspection.
  - `Critical Condition`: Severe overheating (>80°C) or bearing damage (>0.75g); urgent maintenance dispatch required.
- **Evaluation Discipline**:
  - 80% Stratified Training / 20% Holdout Testing.
  - Test metrics evaluated on holdout data:
    - **Accuracy**: 99.9%
    - **Precision**: 99.9%
    - **Recall**: 99.9%
    - **F1-Score**: 99.9%
    - **ROC-AUC (One-vs-Rest)**: 1.00

---

## 4. Academic RUL Calibration Notice

> [!IMPORTANT]
> **Advisory vs Physical RUL Distinction**:
> The model estimates categorical operational risk states based on instantaneous multi-parameter sensor readings. It **does not claim to predict exact physical Remaining Useful Life (RUL)** in hours. True RUL estimation requires validated run-to-failure fatigue cycle datasets (such as NASA C-MAPSS or PRONOSTIA bearing run-to-failure benchmarks) and degradation trend modeling (e.g., Wiener processes or LSTM survival analysis).
