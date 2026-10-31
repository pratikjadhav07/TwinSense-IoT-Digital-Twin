import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { RotateCcw } from 'lucide-react';
import MotorModel from '../digital-twin/MotorModel';

export default function DigitalTwinPage({ 
  machineState, 
  onTriggerScenario 
}) {
  const controlsRef = useRef();
  const { telemetry, health_score } = machineState;

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Digital Twin</h1>
        </div>

        <div className="flex items-center gap-3 text-sm font-mono">
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 font-medium transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-lg">
            {['normal', 'overheating', 'vibration'].map((sc) => (
              <button
                key={sc}
                onClick={() => onTriggerScenario(sc)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                  machineState.connection_status.scenario === sc
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {sc === 'normal' ? 'Nominal' : sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative w-full h-[560px] bg-[#F1F3F5] rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {/* Floating Telemetry Box */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-zinc-200 p-3.5 rounded-lg text-sm font-mono space-y-2 min-w-[210px] pointer-events-none shadow-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <span className="flex items-center gap-1.5 text-zinc-900 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              TELEMETRY
            </span>
            <span className="text-zinc-900 font-bold text-xs">{health_score.toFixed(1)}% Health</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-sans">Core Temp</span>
              <span className="text-zinc-900 font-bold text-sm">{telemetry.temperature_c.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-sans">Speed</span>
              <span className="text-zinc-900 font-bold text-sm">{telemetry.rpm} RPM</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-sans">Vibration</span>
              <span className="text-zinc-900 font-bold text-sm">{telemetry.vibration_proxy.toFixed(2)}g</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-sans">Load</span>
              <span className="text-zinc-900 font-bold text-sm">{telemetry.load_percent}%</span>
            </div>
          </div>
        </div>

        <Canvas
          camera={{ position: [3.5, 2.5, 4.2], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <directionalLight position={[-10, 5, -5]} intensity={0.6} color="#FFFFFF" />
          <pointLight position={[0, -2, 2]} intensity={0.4} />

          <Suspense fallback={null}>
            <MotorModel
              rpm={telemetry.rpm}
              temperature={telemetry.temperature_c}
              vibration={telemetry.vibration_proxy}
              status={machineState.status}
            />
            <Grid
              renderOrder={-1}
              position={[0, -1.3, 0]}
              infiniteGrid
              cellSize={0.6}
              cellThickness={0.5}
              cellColor="#D1D5DB"
              sectionSize={3}
              sectionThickness={1.0}
              sectionColor="#9CA3AF"
              fadeDistance={25}
            />
          </Suspense>

          <OrbitControls 
            ref={controlsRef} 
            makeDefault 
            minDistance={2} 
            maxDistance={12} 
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>
    </div>
  );
}
