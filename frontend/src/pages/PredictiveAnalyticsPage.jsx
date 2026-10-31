import React from 'react';
import { PREVIEW_MODEL_METRICS } from '../data/previewData';

export default function PredictiveAnalyticsPage({ machineState }) {
  const { maintenance_risk, telemetry } = machineState;
  const metrics = PREVIEW_MODEL_METRICS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Predictive Machine Learning</h1>
        <span className="text-xs font-mono text-zinc-500">RandomForestClassifier • N=10,000</span>
      </div>

      {/* Current State Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase text-zinc-500 font-semibold">Active Risk Assessment:</span>
          <span className={`text-xl font-bold font-mono ${
            maintenance_risk.includes('CRITICAL') ? 'text-rose-600' :
            maintenance_risk.includes('ELEVATED') ? 'text-amber-600' : 'text-emerald-700'
          }`}>
            {maintenance_risk}
          </span>
        </div>

        <div className="text-xs font-mono text-zinc-500 flex items-center gap-4">
          <span>Normal: <b className="text-zinc-900 font-semibold">88.5%</b></span>
          <span>Elevated: <b className="text-amber-600 font-semibold">9.4%</b></span>
          <span>Critical: <b className="text-rose-600 font-semibold">2.1%</b></span>
        </div>
      </div>

      {/* 5 Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs text-zinc-500 uppercase block font-semibold">Accuracy</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{(metrics.metrics.accuracy * 100).toFixed(1)}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs text-zinc-500 uppercase block font-semibold">Precision</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{(metrics.metrics.precision * 100).toFixed(1)}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs text-zinc-500 uppercase block font-semibold">Recall</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{(metrics.metrics.recall * 100).toFixed(1)}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs text-zinc-500 uppercase block font-semibold">F1-Score</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{(metrics.metrics.f1_score * 100).toFixed(1)}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs text-zinc-500 uppercase block font-semibold">ROC-AUC</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1.5 block">{(metrics.metrics.roc_auc * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confusion Matrix */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
            Confusion Matrix (Holdout Test N=2,000)
          </span>

          <table className="w-full text-xs font-mono text-center">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 text-xs">
                <th className="py-2.5 text-left font-sans font-medium">Actual \ Predicted</th>
                <th className="py-2.5 font-medium text-zinc-900">Normal</th>
                <th className="py-2.5 font-medium text-amber-600">Elevated</th>
                <th className="py-2.5 font-medium text-rose-600">Critical</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {metrics.confusion_matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="py-2.5 text-left font-medium text-zinc-900 font-sans">{row.actual}</td>
                  <td className="py-2.5 text-zinc-900 font-semibold">{row.pred_normal}</td>
                  <td className="py-2.5 text-amber-600 font-semibold">{row.pred_elevated}</td>
                  <td className="py-2.5 text-rose-600 font-semibold">{row.pred_critical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feature Importance */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 block mb-3">
            Gini Feature Importance
          </span>

          <div className="space-y-3 font-mono text-xs">
            {metrics.feature_importance.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-zinc-700 text-xs mb-1">
                  <span className="font-medium">{f.feature}</span>
                  <span className="text-zinc-900 font-bold">{(f.importance * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 rounded-full"
                    style={{ width: `${f.importance * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
