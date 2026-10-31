import React, { useState } from 'react';

export default function SettingsPage({
  machineState,
  onTriggerScenario
}) {
  const [brokerHost, setBrokerHost] = useState('broker.hivemq.com');
  const [brokerPort, setBrokerPort] = useState('1883');
  const [baseTopic, setBaseTopic] = useState('twinsense/MOTOR-001');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Configuration</h1>
        {savedSuccess && <span className="text-xs font-mono font-bold text-emerald-700">✓ Settings Saved</span>}
      </div>

      {/* Mode Selection */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block">
          Telemetry Source
        </span>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className={`p-3.5 rounded-lg border transition ${
            machineState.connection_status.mode === 'wokwi_esp32'
              ? 'bg-zinc-50 border-zinc-900 text-zinc-900 shadow-sm'
              : 'bg-white border-zinc-200 text-zinc-500'
          }`}>
            <span className="font-bold text-sm block">Mode 1: Wokwi ESP32</span>
            <span className="text-xs text-zinc-600 block mt-1">Live edge telemetry over MQTT</span>
          </div>

          <div className={`p-3.5 rounded-lg border transition ${
            machineState.connection_status.mode === 'software_fallback'
              ? 'bg-zinc-50 border-zinc-900 text-zinc-900 shadow-sm'
              : 'bg-white border-zinc-200 text-zinc-500'
          }`}>
            <span className="font-bold text-sm block">Mode 2: Fallback Engine</span>
            <span className="text-xs text-zinc-600 block mt-1">Python continuous generator</span>
          </div>
        </div>
      </div>

      {/* Fault Injection Buttons */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block">
          Fault Injection Triggers
        </span>

        <div className="grid grid-cols-4 gap-3 text-xs font-mono">
          {[
            { id: 'normal', label: 'Nominal' },
            { id: 'overheating', label: 'Overheat' },
            { id: 'vibration', label: 'Vibration' },
            { id: 'combined', label: 'Combined' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => onTriggerScenario(sc.id)}
              className="py-3 px-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 text-center font-semibold text-zinc-800 hover:bg-zinc-50 transition shadow-sm"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* MQTT Configuration */}
      <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 text-xs font-mono shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block">
          MQTT Transport Configuration
        </span>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-600 block mb-1 text-xs font-medium">Broker Hostname</label>
            <input
              type="text"
              value={brokerHost}
              onChange={(e) => setBrokerHost(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 text-xs shadow-sm"
            />
          </div>

          <div>
            <label className="text-zinc-600 block mb-1 text-xs font-medium">Port</label>
            <input
              type="text"
              value={brokerPort}
              onChange={(e) => setBrokerPort(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 text-xs shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-zinc-600 block mb-1 text-xs font-medium">Topic</label>
          <input
            type="text"
            value={baseTopic}
            onChange={(e) => setBaseTopic(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 text-xs shadow-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition shadow-sm"
          >
            Apply Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
