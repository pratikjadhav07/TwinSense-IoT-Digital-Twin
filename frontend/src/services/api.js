/**
 * TwinSense Frontend API Service
 * Encapsulates REST API calls to FastAPI backend with fallback handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE_URL}/status`);
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function fetchMachines() {
  const res = await fetch(`${API_BASE_URL}/machines`);
  if (!res.ok) throw new Error("Failed to fetch machines");
  return res.json();
}

export async function fetchLatestTelemetry(machineId = "MOTOR-001") {
  const res = await fetch(`${API_BASE_URL}/machines/${machineId}/sensors/latest`);
  if (!res.ok) throw new Error("Failed to fetch latest telemetry");
  return res.json();
}

export async function fetchTelemetryHistory(machineId = "MOTOR-001", limit = 50) {
  const res = await fetch(`${API_BASE_URL}/machines/${machineId}/sensors/history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch telemetry history");
  return res.json();
}

export async function fetchAnomalies(limit = 30) {
  const res = await fetch(`${API_BASE_URL}/analytics/anomalies?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE_URL}/analytics/model-metrics`);
  if (!res.ok) throw new Error("Failed to fetch model metrics");
  return res.json();
}

export async function fetchMaintenanceTasks(status = null) {
  const url = status && status !== "all" 
    ? `${API_BASE_URL}/maintenance?status=${status}` 
    : `${API_BASE_URL}/maintenance`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch maintenance tasks");
  return res.json();
}

export async function createMaintenanceTask(taskData) {
  const res = await fetch(`${API_BASE_URL}/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error("Failed to create maintenance task");
  return res.json();
}

export async function updateMaintenanceTask(taskId, updates) {
  const res = await fetch(`${API_BASE_URL}/maintenance/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to update maintenance task");
  return res.json();
}

export async function setSimulationScenario(scenario) {
  const res = await fetch(`${API_BASE_URL}/simulation/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario })
  });
  if (!res.ok) throw new Error("Failed to set simulation scenario");
  return res.json();
}

export async function pauseSimulation() {
  const res = await fetch(`${API_BASE_URL}/simulation/pause`, { method: "POST" });
  return res.json();
}

export async function startSimulation() {
  const res = await fetch(`${API_BASE_URL}/simulation/start`, { method: "POST" });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE_URL}/simulation/reset`, { method: "POST" });
  return res.json();
}
