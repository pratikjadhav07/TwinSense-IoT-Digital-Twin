import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from 'recharts';

export default function AnomalyDetectionPage({ historyData, machineState, alerts }) {
  const { anomaly_detected, anomaly_score } = machineState;

  const scatterData = historyData.map((d) => ({
    time: d.timeStr,
    temp: d.temperature_c,
    vib: d.vibration_proxy,
    is_anomaly: d.is_anomaly,
    score: d.is_anomaly ? -0.42 : +(0.15 - Math.random() * 0.1).toFixed(2),
  }));

  const nominalPoints = scatterData.filter(d => !d.is_anomaly);
  const anomalyPoints = scatterData.filter(d => d.is_anomaly);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Anomaly Detection</h1>
        <span className="text-xs font-mono text-zinc-500">Isolation Forest (Contamination=0.05)</span>
      </div>

      {/* State Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">System State</span>
          <span className={`text-xl font-bold mt-1.5 block ${anomaly_detected ? 'text-rose-600' : 'text-emerald-700'}`}>
            {anomaly_detected ? 'Anomaly' : 'Nominal'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Anomaly Score</span>
          <span className="text-xl font-bold text-zinc-900 mt-1.5 block">{anomaly_score.toFixed(2)}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Inliers</span>
          <span className="text-xl font-bold text-zinc-900 mt-1.5 block">{nominalPoints.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Outliers</span>
          <span className="text-xl font-bold text-rose-600 mt-1.5 block">{anomalyPoints.length}</span>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
          Feature Phase Plane (Temperature vs Vibration Proxy)
        </span>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
              <XAxis type="number" dataKey="temp" unit="°C" stroke="#71717A" fontSize={11} domain={[40, 85]} />
              <YAxis type="number" dataKey="vib" unit="g" stroke="#71717A" fontSize={11} domain={[0.1, 0.9]} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }} />
              <Scatter name="Nominal" data={nominalPoints} fill="#2563EB" shape="circle" />
              <Scatter name="Anomaly" data={anomalyPoints} fill="#EF4444" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alarm Log Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
          Anomaly Provenance Log
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 text-xs text-left">
                <th className="py-2.5 font-medium">Alarm ID</th>
                <th className="py-2.5 font-medium">Channel</th>
                <th className="py-2.5 font-medium">Provenance</th>
                <th className="py-2.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {alerts.map(a => (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className="py-2.5 font-bold text-zinc-900">{a.id}</td>
                  <td className="py-2.5 text-zinc-700">{a.sensor}</td>
                  <td className="py-2.5 text-zinc-500 font-sans">{a.rule_or_ml}</td>
                  <td className="py-2.5 uppercase font-bold text-xs">
                    <span className={a.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}>
                      {a.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
