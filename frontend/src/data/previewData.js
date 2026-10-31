/**
 * TwinSense - Preview Data Module
 * Explicitly labeled sample data for Phase 1 UI scaffolding and layout testing.
 * Strictly adheres to the project schema and demonstrates all expected states.
 */

export const PREVIEW_METADATA = {
  isSampleData: true,
  label: "SAMPLE PREVIEW DATA (Phase 1 Foundation)",
  disclaimer: "These values are illustrative frontend preview records. In Phase 5, this will be replaced with live WebSocket & REST feeds from the FastAPI backend.",
};

export const INITIAL_MACHINE_STATE = {
  machine_id: "MOTOR-001",
  name: "Main Induction Motor - Line 3",
  type: "Three-Phase AC Induction (15 kW)",
  rated_rpm: 1500,
  rated_temp_c: 65.0,
  max_temp_c: 85.0,
  max_vibration_proxy: 0.80,
  status: "NORMAL", // NORMAL | WARNING | CRITICAL | STOPPED
  health_score: 92.4, // 0 - 100
  maintenance_risk: "LOW RISK", // LOW RISK | ELEVATED RISK | CRITICAL RISK
  anomaly_detected: false,
  anomaly_score: -0.12, // Isolation forest negative score
  data_source: "Preview Scaffold (Phase 1)",
  last_updated: new Date().toISOString(),
  telemetry: {
    temperature_c: 54.2,
    humidity_percent: 42.5,
    vibration_proxy: 0.32,
    rpm: 1478,
    load_percent: 58.4,
  },
  connection_status: {
    iot_connected: false,
    broker_connected: false,
    backend_connected: false,
    mode: "software_fallback", // 'wokwi_esp32' | 'software_fallback'
    scenario: "normal", // 'normal' | 'overheating' | 'vibration' | 'combined'
  }
};

// 30 historical data points for realistic trend charting
export const GENERATE_PREVIEW_HISTORY = () => {
  const points = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now - i * 5000);
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    // Add natural micro-variations
    const jitter = Math.sin(i * 0.5) * 1.5;
    const isAnomaly = i === 12; // One sample anomaly marker for visual verification
    
    points.push({
      timestamp: timestamp.toISOString(),
      timeStr,
      temperature_c: +(52.0 + jitter + (isAnomaly ? 18.0 : 0)).toFixed(1),
      humidity_percent: +(42.0 + Math.cos(i) * 1.0).toFixed(1),
      vibration_proxy: +(0.30 + Math.abs(Math.sin(i * 0.8) * 0.08) + (isAnomaly ? 0.35 : 0)).toFixed(2),
      rpm: Math.round(1480 + Math.sin(i) * 15 - (isAnomaly ? 240 : 0)),
      load_percent: Math.round(55 + jitter * 2 + (isAnomaly ? 30 : 0)),
      health_score: +(isAnomaly ? 64.0 : 92.0 + jitter * 0.8).toFixed(1),
      is_anomaly: isAnomaly,
      risk_level: isAnomaly ? "ELEVATED" : "NORMAL",
    });
  }
  return points;
};

export const PREVIEW_ALERTS = [
  {
    id: "ALT-1082",
    machine_id: "MOTOR-001",
    timestamp: "2026-10-24T14:45:10Z",
    severity: "warning", // info | warning | critical
    sensor: "Temperature / Cooling",
    rule_or_ml: "Rule-Based + Anomaly Detector",
    title: "Elevated Stator Temperature Spike",
    explanation: "Temperature exceeded 70°C operating advisory limit during sustained 85% load cycle.",
    recommended_action: "Inspect motor cooling cowl and ventilation ducts for obstruction; check ambient cabinet airflow.",
    status: "acknowledged", // pending | acknowledged | resolved
    acknowledged_by: "Lead Reliability Engineer",
  },
  {
    id: "ALT-1081",
    machine_id: "MOTOR-001",
    timestamp: "2026-10-24T12:18:00Z",
    severity: "critical",
    sensor: "Vibration Proxy / Bearings",
    rule_or_ml: "Isolation Forest Anomaly Model (Score: -0.42)",
    title: "High Vibration Proxy Anomaly",
    explanation: "Multi-axis vibration proxy surged to 0.78, indicating mechanical unbalance or bearing inner race fault.",
    recommended_action: "Perform acoustic strobe vibration analysis; schedule mechanical alignment inspection.",
    status: "pending",
    acknowledged_by: null,
  },
  {
    id: "ALT-1079",
    machine_id: "MOTOR-001",
    timestamp: "2026-10-24T08:30:22Z",
    severity: "info",
    sensor: "RPM / Drive Coupling",
    rule_or_ml: "Telemetry Boundary Watcher",
    title: "Transient RPM Slip Under Rapid Load Ramp",
    explanation: "Slip increased temporarily by 3.8% during conveyor belt startup cycle.",
    recommended_action: "No immediate action required. Logged in telemetry journal.",
    status: "resolved",
    acknowledged_by: "System Automation",
  }
];

export const PREVIEW_MAINTENANCE_TASKS = [
  {
    task_id: "TASK-401",
    machine_id: "MOTOR-001",
    created_at: "2026-10-24T12:20:00Z",
    title: "Front Drive-End Bearing Greasing & Alignment",
    severity: "high",
    status: "in_progress", // pending | in_progress | resolved
    triggering_fault: "High Vibration Proxy Anomaly (ALT-1081)",
    assigned_technician: "Alex Rivera (Vibration Level II)",
    recommendation: "Inspect bearing housing temperature, check grease condition for metallic particles, re-torque mounting bolts.",
    resolution_notes: "Inspected drive-end coupling; bearing temperature stabilized at 56°C. Grease replenished with synthetic lithium complex.",
  },
  {
    task_id: "TASK-398",
    machine_id: "MOTOR-001",
    created_at: "2026-10-23T09:15:00Z",
    title: "Stator Air Filter & Ventilation Fan Cleaning",
    severity: "medium",
    status: "resolved",
    triggering_fault: "Thermal dissipation degradation warning",
    assigned_technician: "Priya Sharma",
    recommendation: "Blow out cooling cowl with dry compressed air; verify fan impellers are intact.",
    resolution_notes: "Cowl cleared of dust accumulation. Free airflow restored. Temperature delta dropped 6°C.",
  },
  {
    task_id: "TASK-392",
    machine_id: "MOTOR-001",
    created_at: "2026-10-20T16:00:00Z",
    title: "Periodic Electrical Insulation Resistance Test",
    severity: "low",
    status: "resolved",
    triggering_fault: "Quarterly Predictive Maintenance Schedule",
    assigned_technician: "Marco Chen",
    recommendation: "Megohmmeter 1000V DC test between phases and to ground.",
    resolution_notes: "Insulation resistance > 500 Megaohms across all three winding terminals. Passed IEEE-43 standard.",
  }
];

export const PREVIEW_MODEL_METRICS = {
  model_name: "Supervised Random Forest Classifier (v1.2.0)",
  anomaly_model_name: "Unsupervised Isolation Forest (Contamination=0.05)",
  trained_date: "2026-10-24",
  dataset_source: "Synthetic Motor Behaviour Simulation + Industrial Baseline (N=10,000 samples)",
  test_split: "80% Train / 20% Test (Stratified K-Fold)",
  metrics: {
    accuracy: 0.948,
    precision: 0.932,
    recall: 0.925,
    f1_score: 0.928,
    roc_auc: 0.976,
  },
  confusion_matrix: [
    { actual: "Normal", pred_normal: 1420, pred_elevated: 48, pred_critical: 8 },
    { actual: "Elevated Risk", pred_normal: 32, pred_elevated: 380, pred_critical: 22 },
    { actual: "Critical Condition", pred_normal: 4, pred_elevated: 14, pred_critical: 172 },
  ],
  feature_importance: [
    { feature: "Vibration Proxy", importance: 0.38 },
    { feature: "Temperature (°C)", importance: 0.27 },
    { feature: "Rolling Temp Variance", importance: 0.14 },
    { feature: "Load Percentage", importance: 0.12 },
    { feature: "RPM Deviation", importance: 0.09 },
  ],
  calibration_disclaimer: "Advisory engineering metric: Model predictions categorize operational risk states. They do not constitute an exact Remaining Useful Life (RUL) prediction without validated run-to-failure historical logs.",
};
