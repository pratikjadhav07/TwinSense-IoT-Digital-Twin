import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer
} from 'recharts';

export default function LiveSensorsPage({ historyData }) {
  const [timeWindow, setTimeWindow] = useState('5m');

  const temps = historyData.map(d => d.temperature_c);
  const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);

  const vibs = historyData.map(d => d.vibration_proxy);
  const avgVib = (vibs.reduce((a, b) => a + b, 0) / vibs.length).toFixed(2);

  const rpms = historyData.map(d => d.rpm);
  const avgRpm = Math.round(rpms.reduce((a, b) => a + b, 0) / rpms.length);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Sensor Telemetry</h1>

        <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-lg text-xs font-mono">
          <span className="text-xs text-zinc-500 px-2 font-medium">Window:</span>
          {['1m', '5m', '15m', '1h'].map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                timeWindow === w
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3.5 text-xs font-mono">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Mean Temperature</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{avgTemp} °C</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Mean Vibration</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{avgVib} g</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-zinc-500 text-xs font-semibold uppercase block">Mean Velocity</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{avgRpm} RPM</span>
        </div>
      </div>

      {/* Chart 1: Temperature */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
          Stator Temperature Stream (°C)
        </span>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} domain={[30, 95]} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }} />
              <Line type="monotone" dataKey="temperature_c" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Vibration */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
          Vibration Proxy Signal (g)
        </span>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} domain={[0, 1.0]} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }} />
              <Line type="monotone" dataKey="vibration_proxy" stroke="#D97706" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Row: RPM & Load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
            Rotor Velocity (RPM)
          </span>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} domain={[1200, 1600]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }} />
                <Line type="monotone" dataKey="rpm" stroke="#18181B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
            Motor Load Percentage (%)
          </span>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="timeStr" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '12px', color: '#18181B' }} />
                <Line type="monotone" dataKey="load_percent" stroke="#64748B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
