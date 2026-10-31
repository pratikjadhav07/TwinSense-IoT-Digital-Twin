import React, { useState } from 'react';
import { PREVIEW_MAINTENANCE_TASKS } from '../data/previewData';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState(PREVIEW_MAINTENANCE_TASKS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [newNote, setNewNote] = useState('');

  const handleResolveTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.task_id === taskId) {
        return {
          ...t,
          status: 'resolved',
          resolution_notes: newNote || 'Inspection completed. Telemetry nominal.',
        };
      }
      return t;
    }));
    setSelectedTask(null);
    setNewNote('');
  };

  const handleStartTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.task_id === taskId) {
        return { ...t, status: 'in_progress' };
      }
      return t;
    }));
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Work Orders</h1>

        <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-lg text-xs font-mono">
          {['all', 'in_progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {st === 'all' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div 
            key={task.task_id} 
            className="p-4 sm:p-5 rounded-xl bg-white border border-zinc-200 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-800 font-bold text-xs px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  {task.task_id}
                </span>
                <span className="font-bold text-zinc-900 text-base">{task.title}</span>
                <span className={`text-xs font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                  task.severity === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {task.severity}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase font-medium">
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => setSelectedTask(task.task_id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 transition shadow-sm"
                  >
                    Resolve Work Order
                  </button>
                )}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStartTask(task.task_id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition shadow-sm"
                  >
                    Start Task
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-600 space-y-1">
              <div>
                <span className="text-zinc-500 font-medium">Triggering Condition:</span> {task.triggering_fault}
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Action Directive:</span> {task.recommendation}
              </div>
              {task.resolution_notes && (
                <div className="mt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono">
                  <span className="font-bold text-emerald-700 block mb-1">Technician Log:</span>
                  {task.resolution_notes}
                </div>
              )}
            </div>

            {selectedTask === task.task_id && (
              <div className="mt-3 pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Technician findings, parts replaced, lubrication..."
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 font-mono shadow-sm"
                />
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleResolveTask(task.task_id)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
                  >
                    Save & Close
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
