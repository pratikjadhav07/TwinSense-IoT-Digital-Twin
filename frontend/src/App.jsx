import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import PredictiveHealthPage from './pages/PredictiveHealthPage';
import MaintenancePage from './pages/MaintenancePage';
import SettingsPage from './pages/SettingsPage';
import { 
  INITIAL_MACHINE_STATE, 
  GENERATE_PREVIEW_HISTORY, 
  PREVIEW_ALERTS 
} from './data/previewData';
import { 
  fetchLatestTelemetry, 
  fetchTelemetryHistory, 
  fetchAnomalies, 
  setSimulationScenario 
} from './services/api';
import { useTelemetryWebSocket } from './hooks/useTelemetryWebSocket';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [machineState, setMachineState] = useState(INITIAL_MACHINE_STATE);
  const [historyData, setHistoryData] = useState(GENERATE_PREVIEW_HISTORY());
  const [alerts, setAlerts] = useState(PREVIEW_ALERTS);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Incoming WebSocket Telemetry Handler
  const handleWebSocketTelemetry = useCallback((liveTwinState) => {
    setIsBackendOnline(true);
    setMachineState((prev) => ({
      ...liveTwinState,
      connection_status: {
        ...liveTwinState.connection_status,
        backend_connected: true,
      }
    }));

    // Append to live charts history
    const t = liveTwinState.telemetry;
    const now = new Date(liveTwinState.last_updated || Date.now());
    setHistoryData((prev) => {
      const newPoint = {
        timestamp: now.toISOString(),
        timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperature_c: t.temperature_c,
        humidity_percent: t.humidity_percent,
        vibration_proxy: t.vibration_proxy,
        rpm: t.rpm,
        load_percent: t.load_percent,
        health_score: liveTwinState.health_score,
        is_anomaly: liveTwinState.anomaly_detected,
        risk_level: liveTwinState.maintenance_risk,
      };
      return [...prev.slice(1), newPoint];
    });
  }, []);

  // Incoming alert handler
  const handleWebSocketAlert = useCallback((newAlert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === newAlert.id)) return prev;
      return [newAlert, ...prev];
    });
  }, []);

  // Connect WebSocket Hook
  const { isConnected: isWsConnected } = useTelemetryWebSocket({
    onTelemetryUpdate: handleWebSocketTelemetry,
    onNewAlert: handleWebSocketAlert,
  });

  // Initial REST baseline fetch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const latest = await fetchLatestTelemetry("MOTOR-001");
        if (latest) {
          setIsBackendOnline(true);
          setMachineState((p) => ({
            ...latest,
            connection_status: {
              ...latest.connection_status,
              backend_connected: true,
            }
          }));
        }

        const hist = await fetchTelemetryHistory("MOTOR-001", 30);
        if (hist && hist.length > 0) {
          const formatted = hist.map((d) => ({
            timestamp: d.timestamp,
            timeStr: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature_c: d.temperature_c,
            humidity_percent: d.humidity_percent,
            vibration_proxy: d.vibration_proxy,
            rpm: d.rpm,
            load_percent: d.load_percent,
            health_score: d.status === 'CRITICAL' ? 55.0 : d.status === 'WARNING' ? 75.0 : 93.0,
            is_anomaly: d.status === 'CRITICAL',
            risk_level: d.status,
          }));
          setHistoryData(formatted);
        }

        const anomalyList = await fetchAnomalies(20);
        if (anomalyList && anomalyList.length > 0) {
          setAlerts(anomalyList);
        }
      } catch (err) {
        setIsBackendOnline(false);
      }
    }

    loadInitialData();
  }, []);

  // Alert acknowledgement
  const handleAcknowledgeAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    );
  };

  // Scenario trigger
  const handleTriggerScenario = async (scenario) => {
    try {
      if (isBackendOnline) {
        await setSimulationScenario(scenario);
      }
    } catch (e) {
      console.warn("Could not dispatch scenario to backend, updating local state:", e);
    }

    let newTemp = 54.2;
    let newVib = 0.32;
    let newRpm = 1480;
    let newLoad = 55;
    let newHealth = 92.4;
    let newRisk = "LOW RISK";
    let isAnomaly = false;

    if (scenario === 'overheating') {
      newTemp = 78.6;
      newHealth = 68.0;
      newRisk = "ELEVATED RISK";
    } else if (scenario === 'vibration') {
      newVib = 0.78;
      newHealth = 61.5;
      newRisk = "CRITICAL RISK";
      isAnomaly = true;
    } else if (scenario === 'combined') {
      newTemp = 82.4;
      newVib = 0.85;
      newRpm = 1320;
      newLoad = 94;
      newHealth = 42.0;
      newRisk = "CRITICAL RISK";
      isAnomaly = true;
    }

    setMachineState((prev) => ({
      ...prev,
      health_score: newHealth,
      maintenance_risk: newRisk,
      anomaly_detected: isAnomaly,
      anomaly_score: isAnomaly ? -0.45 : -0.12,
      last_updated: new Date().toISOString(),
      telemetry: {
        ...prev.telemetry,
        temperature_c: newTemp,
        vibration_proxy: newVib,
        rpm: newRpm,
        load_percent: newLoad,
      },
      connection_status: {
        ...prev.connection_status,
        scenario,
      }
    }));
  };

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* Precision Industrial Header */}
      <Header 
        machineState={machineState} 
        activePageTitle={activeItem.label}
        onMachineChange={(id) => setMachineState((p) => ({ ...p, machine_id: id }))}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewPage
              machineState={machineState}
              historyData={historyData}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onTriggerScenario={handleTriggerScenario}
            />
          )}

          {activeTab === 'digital-twin' && (
            <DigitalTwinPage
              machineState={machineState}
              onTriggerScenario={handleTriggerScenario}
            />
          )}

          {activeTab === 'analytics' && (
            <PredictiveHealthPage
              machineState={machineState}
              historyData={historyData}
              onNavigateToMaintenance={() => setActiveTab('maintenance')}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePage
              machineState={machineState}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              machineState={machineState}
              onUpdateSettings={() => {}}
              onTriggerScenario={handleTriggerScenario}
            />
          )}
        </main>
      </div>
    </div>
  );
}
