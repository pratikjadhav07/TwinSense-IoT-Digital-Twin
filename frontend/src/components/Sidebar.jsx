import React from 'react';
import { 
  LayoutDashboard, 
  Box, 
  LineChart, 
  BrainCircuit, 
  ShieldAlert, 
  Wrench, 
  Sliders
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'digital-twin', label: 'Digital Twin', icon: Box },
  { id: 'analytics', label: 'Predictive Health', icon: BrainCircuit },
  { id: 'maintenance', label: 'Work Orders', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none">
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors text-left ${
                isActive
                  ? 'bg-zinc-900 text-white font-medium shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
