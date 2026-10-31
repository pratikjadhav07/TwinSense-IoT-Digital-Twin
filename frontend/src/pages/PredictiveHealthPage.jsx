import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

export default function PredictiveHealthPage({ 
  machineState, 
  historyData = [], 
  onNavigateToMaintenance 
}) {
  const { telemetry, health_score, maintenance_risk, risk_probabilities } = machineState;

  const isCritical = maintenance_risk.includes('CRITICAL');
  const isElevated = maintenance_risk.includes('ELEVATED');
  const riskColor = isCritical ? 'text-rose-600' : isElevated ? 'text-amber-600' : 'text-emerald-700';
  const riskBg = isCritical ? 'bg-rose-50 border-rose-200' : isElevated ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50/60 border-emerald-200';

  // Dynamic probabilities
  let probNormal = 98;
  let probElevated = 2;
  let probCritical = 0;

  if (risk_probabilities && Object.keys(risk_probabilities).length > 0) {
    probNormal = Math.round((risk_probabilities['Normal'] || 0) * 100);
    probElevated = Math.round((risk_probabilities['Elevated Risk'] || 0) * 100);
    probCritical = Math.round((risk_probabilities['Critical Condition'] || 0) * 100);
  } else if (isCritical) {
    probNormal = 6;
    probElevated = 28;
    probCritical = 66;
  } else if (isElevated) {
    probNormal = 28;
    probElevated = 62;
    probCritical = 10;
  }

  // RUL (Remaining Useful Life)
  const rulHours = isCritical
    ? Math.max(14, Math.round(36 * (health_score / 100)))
    : isElevated
    ? Math.max(120, Math.round(320 * (health_score / 100)))
    : Math.max(950, Math.round(1850 * (health_score / 100)));

  // Subsystem values
  const vibValue = telemetry.vibration_proxy || 0.32;
  const tempValue = telemetry.temperature_c || 54.2;
  const rpmValue = telemetry.rpm || 1480;

  // Scatter chart data
  const scatterData = historyData.map((d) => ({
    temp: d.temperature_c,
    vib: d.vibration_proxy,
    is_anomaly: d.is_anomaly,
  }));
  const nominalPoints = scatterData.filter(d => !d.is_anomaly);
  const anomalyPoints = scatterData.filter(d => d.is_anomaly);
  const currentLivePoint = [{
    temp: telemetry.temperature_c,
    vib: telemetry.vibration_proxy,
  }];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Predictive Health</h1>
        <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Live Model Active
        </span>
      </div>

      {/* 3 Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Level */}
        <div className={`p-5 rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${riskBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Risk Level
            </span>
            {isCritical || isElevated ? (
              <AlertTriangle className={`w-4 h-4 ${riskColor}`} />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${riskColor}`}>
            {maintenance_risk}
          </div>
        </div>

        {/* Health Index */}
        <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Health Score
            </span>
            <span className="text-xs font-mono text-zinc-400">Target &gt; 85%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 mt-2">
            {health_score.toFixed(1)}%
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                health_score < 70 ? 'bg-rose-500' : health_score < 85 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, health_score))}%` }}
            />
          </div>
        </div>

        {/* Remaining Useful Life */}
        <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Est. Remaining Life
            </span>
            <span className="text-xs font-mono text-zinc-400">RUL</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className={`text-2xl font-bold font-mono ${
              rulHours < 50 ? 'text-rose-600' : rulHours < 300 ? 'text-amber-600' : 'text-zinc-900'
            }`}>
              {rulHours.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-zinc-500">Hours</span>
          </div>
        </div>
      </div>

      {/* Failure Risk Probability Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Failure Probability
          </span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-medium">Normal: {probNormal}%</span>
            <span className="text-amber-600 font-medium">Elevated: {probElevated}%</span>
            <span className="text-rose-600 font-medium">Critical: {probCritical}%</span>
          </div>
        </div>
        <div className="w-full bg-zinc-100 rounded-md h-2 overflow-hidden flex gap-0.5 p-0.5">
          <div 
            className="h-full bg-emerald-600 rounded-sm transition-all duration-500"
            style={{ width: `${probNormal}%` }}
          />
          <div 
            className="h-full bg-amber-500 rounded-sm transition-all duration-500"
            style={{ width: `${probElevated}%` }}
          />
          <div 
            className="h-full bg-rose-600 rounded-sm transition-all duration-500"
            style={{ width: `${probCritical}%` }}
          />
        </div>
      </div>

      {/* Subsystem Metrics (3 Minimal Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vibration */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Vibration
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
              vibValue > 0.70 ? 'bg-rose-50 text-rose-700' : vibValue > 0.45 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {vibValue > 0.70 ? 'Critical' : vibValue > 0.45 ? 'Warning' : 'Normal'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 mt-2">
            {vibValue.toFixed(2)} <span className="text-xs text-zinc-400 font-normal">g</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1 mt-2.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                vibValue > 0.70 ? 'bg-rose-500' : vibValue > 0.45 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (vibValue / 0.80) * 100)}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Temperature
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
              tempValue > 75 ? 'bg-rose-50 text-rose-700' : tempValue > 65 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {tempValue > 75 ? 'Overheat' : tempValue > 65 ? 'Warning' : 'Normal'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 mt-2">
            {tempValue.toFixed(1)} <span className="text-xs text-zinc-400 font-normal">°C</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1 mt-2.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                tempValue > 75 ? 'bg-rose-500' : tempValue > 65 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (tempValue / 85) * 100)}%` }}
            />
          </div>
        </div>

        {/* Velocity */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Velocity
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded font-semibold bg-zinc-100 text-zinc-700">
              {rpmValue} RPM
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 mt-2">
            {Math.max(0, 1500 - rpmValue)} <span className="text-xs text-zinc-400 font-normal">RPM slip</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1 mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-zinc-800 rounded-full"
              style={{ width: `${Math.min(100, (rpmValue / 1500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Operating Envelope & Prescriptive Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Minimal Scatter Chart */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Operating Envelope
            </span>
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Anomaly
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-700" /> Current
              </span>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="temp" unit="°C" stroke="#71717A" fontSize={11} domain={[30, 90]} tickLine={false} />
                <YAxis type="number" dataKey="vib" unit="g" stroke="#71717A" fontSize={11} domain={[0.0, 1.0]} tickLine={false} />
                <ReferenceLine x={75} stroke="#FCA5A5" strokeDasharray="3 3" />
                <ReferenceLine y={0.70} stroke="#FCA5A5" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '11px', color: '#18181B' }} />
                <Scatter name="Nominal" data={nominalPoints} fill="#3B82F6" shape="circle" />
                <Scatter name="Anomaly" data={anomalyPoints} fill="#EF4444" shape="circle" />
                <Scatter name="Current" data={currentLivePoint} fill="#10B981" shape="diamond" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Minimal Action Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 block mb-3">
              Recommended Action
            </span>

            {isCritical ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs font-mono space-y-1">
                <div className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  CRITICAL: IMMEDIATE ATTENTION REQUIRED
                </div>
                <p>
                  {vibValue > 0.70
                    ? 'High vibration proxy (>0.70g). Inspect bearing housing and coupling bolts.'
                    : 'Stator temperature exceeded limit (>75°C). Clean ventilation shroud and verify cooling fan.'}
                </p>
              </div>
            ) : isElevated ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs font-mono space-y-1">
                <div className="font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ADVISORY: ELEVATED STRESS DETECTED
                </div>
                <p>
                  Operating near advisory threshold. Schedule lubrication and inspection during next maintenance window.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs font-mono space-y-1">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SYSTEM NOMINAL
                </div>
                <p>
                  All telemetry is operating within healthy baseline tolerances. Next routine inspection in ~450 hours.
                </p>
              </div>
            )}
          </div>

          {onNavigateToMaintenance && (
            <div className="flex justify-end pt-2">
              <button
                onClick={onNavigateToMaintenance}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition shadow-sm"
              >
                <span>Work Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
