import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export default function AlertBanner({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        
        return (
          <div 
            key={alert.id}
            className={`px-4 py-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm shadow-sm ${
              isCritical 
                ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCritical ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                  isCritical ? 'bg-rose-200/60 text-rose-800' : 'bg-amber-200/60 text-amber-800'
                }`}>
                  {alert.id}
                </span>
                <span className="font-semibold">{alert.title}</span>
                <span className={`text-xs hidden md:inline ${isCritical ? 'text-rose-700' : 'text-amber-700'}`}>
                  — {alert.recommended_action}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {alert.status === 'acknowledged' ? (
                <span className="text-xs font-mono text-emerald-700 font-medium">
                  ✓ Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => onAcknowledge && onAcknowledge(alert.id)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 shadow-sm transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
