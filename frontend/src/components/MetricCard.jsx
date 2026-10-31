import React from 'react';

export default function MetricCard({
  title,
  value,
  unit,
  status = "normal",
  limitLabel,
  currentPercent,
}) {
  const getDot = () => {
    if (status === 'critical') return <span className="w-2 h-2 rounded-full bg-[#EF4444]" />;
    if (status === 'warning') return <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />;
    return <span className="w-2 h-2 rounded-full bg-[#22C55E]" />;
  };

  return (
    <div className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-semibold">
        <span>{title}</span>
        {getDot()}
      </div>

      <div className="my-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono tracking-tight text-zinc-900">
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500 font-mono font-medium">{unit}</span>}
      </div>

      {currentPercent !== undefined && (
        <div className="space-y-1.5">
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
              style={{ width: `${Math.min(Math.max(currentPercent, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-zinc-500">
            <span>{limitLabel}</span>
            <span>{currentPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
