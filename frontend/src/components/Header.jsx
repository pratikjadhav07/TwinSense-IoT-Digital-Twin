import React from 'react';
import { Activity, Clock } from 'lucide-react';

export default function Header({ 
  machineState, 
  activePageTitle 
}) {
  const { machine_id, connection_status, last_updated } = machineState;
  
  return (
    <header className="bg-white border-b border-zinc-200 px-6 py-3 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        {/* Brand & Section Navigation */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-zinc-900 font-semibold tracking-tight">TwinSense</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-600">{activePageTitle}</span>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded text-xs font-semibold">
            {machine_id}
          </span>

          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className={`w-2 h-2 rounded-full ${
              connection_status.broker_connected ? 'bg-emerald-500' : 'bg-zinc-400'
            }`} />
            <span>MQTT</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className={`w-2 h-2 rounded-full ${
              connection_status.iot_connected ? 'bg-blue-600' : 'bg-amber-500'
            }`} />
            <span>{connection_status.iot_connected ? 'Wokwi' : 'Simulator'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{new Date(last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
