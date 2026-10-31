import React from 'react';
import MetricCard from '../components/MetricCard';
import AlertBanner from '../components/AlertBanner';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';

export default function OverviewPage({
  machineState,
  historyData,
  alerts,
  onAcknowledgeAlert,
  onTriggerScenario,
}) {
  const { telemetry, health_score, maintenance_risk, connection_status } = machineState;

  const tempStatus = telemetry.temperature_c > 75 ? 'critical' : telemetry.temperature_c > 65 ? 'warning' : 'normal';
  const vibStatus = telemetry.vibration_proxy > 0.7 ? 'critical' : telemetry.vibration_proxy > 0.45 ? 'warning' : 'normal';
  const rpmStatus = telemetry.rpm < 1200 || telemetry.rpm > 1600 ? 'warning' : 'normal';
  const riskStatus = maintenance_risk.includes('CRITICAL') ? 'critical' : maintenance_risk.includes('ELEVATED') ? 'warning' : 'normal';

  return (
    <div className="space-y-6">
      {/* Header & Scenario Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Overview</h1>
        </div>

        {/* Professional Segmented Control */}
        <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-lg text-sm font-mono">
          <span className="text-xs text-zinc-500 px-2 font-medium">Scenario:</span>
          {[
            { id: 'normal', label: 'Nominal' },
            { id: 'overheating', label: 'Overheat' },
            { id: 'vibration', label: 'Vibration' },
            { id: 'combined', label: 'Fault' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => onTriggerScenario(sc.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                connection_status.scenario === sc.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid (6 Clean Bold Metric Cards - Upward) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Health Score"
          value={health_score.toFixed(1)}
          unit="%"
          status={health_score < 70 ? 'critical' : health_score < 85 ? 'warning' : 'normal'}
          currentPercent={health_score}
          limitLabel="Target"
        />

        <MetricCard
          title="Temperature"
          value={telemetry.temperature_c.toFixed(1)}
          unit="°C"
          status={tempStatus}
          currentPercent={Math.round((telemetry.temperature_c / 85) * 100)}
          limitLabel="85°C Max"
        />

        <MetricCard
          title="Vibration"
          value={telemetry.vibration_proxy.toFixed(2)}
          unit="g"
          status={vibStatus}
          currentPercent={Math.round((telemetry.vibration_proxy / 1.0) * 100)}
          limitLabel="0.80g Max"
        />

        <MetricCard
          title="Rotor Velocity"
          value={telemetry.rpm}
          unit="RPM"
          status={rpmStatus}
          currentPercent={Math.round((telemetry.rpm / 1500) * 100)}
          limitLabel="1500 Sync"
        />

        <MetricCard
          title="Load Demand"
          value={telemetry.load_percent}
          unit="%"
          status={telemetry.load_percent > 85 ? 'warning' : 'normal'}
          currentPercent={telemetry.load_percent}
          limitLabel="100% Rated"
        />

        <MetricCard
          title="Risk Level"
          value={maintenance_risk}
          status={riskStatus}
        />
      </div>

      {/* Telemetry Charts (Clean Neutral Minimalist) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Temperature & Vibration */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Temperature & Vibration
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-900 font-medium">
                <span className="w-2.5 h-1 bg-blue-600 rounded-sm" />
                Temp (°C)
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                <span className="w-2.5 h-1 bg-slate-500 rounded-sm" />
                Vibration (x100)
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} domain={[20, 90]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }}
                />
                <Line type="monotone" dataKey="temperature_c" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={(d) => Math.round(d.vibration_proxy * 100)} stroke="#64748B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Health & RPM */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Health Index & Velocity
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-900 font-medium">
                <span className="w-2.5 h-1 bg-emerald-600 rounded-sm" />
                Health %
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                <span className="w-2.5 h-1 bg-zinc-800 rounded-sm" />
                RPM
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#71717A" fontSize={11} domain={[40, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#71717A" fontSize={11} domain={[1100, 1600]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="health_score" stroke="#059669" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#18181B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Operating Alarms & Incident Logs (Downside) */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
                Operating Alarms & Event Logs
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
                {alerts.length} Active
              </span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Real-time Anomaly Stream</span>
          </div>
          <AlertBanner alerts={alerts} onAcknowledge={onAcknowledgeAlert} />
        </div>
      )}
    </div>
  );
}
