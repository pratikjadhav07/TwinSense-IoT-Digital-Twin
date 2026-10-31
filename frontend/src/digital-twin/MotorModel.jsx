import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural Industrial Electric Motor 3D Model
 * Built using Three.js / R3F primitives:
 * - Cylindrical stator frame with cooling fins
 * - Drive shaft with rotational animation tied to RPM
 * - Terminal box on top
 * - Drive-end and non-drive-end bearing bells
 * - Base mounting feet
 * - Dynamic color transitions based on machine temperature & vibration
 */
export default function MotorModel({ 
  rpm = 1480, 
  temperature = 54.2, 
  vibration = 0.32,
  status = "normal" 
}) {
  const shaftRef = useRef();
  const rotorRef = useRef();
  const groupRef = useRef();

  // Color calculation based on temperature
  const getHousingColor = () => {
    if (temperature > 75) return '#DC2626'; // Red alarm
    if (temperature > 65) return '#D97706'; // Amber warning
    return '#334155'; // Precision industrial cast slate iron
  };

  // Fin color
  const getFinColor = () => {
    if (temperature > 75) return '#EF4444';
    if (temperature > 65) return '#F59E0B';
    return '#475569';
  };

  useFrame((state, delta) => {
    // Rotation proportional to RPM
    const rotSpeed = (rpm / 60) * Math.PI * 2 * delta * 0.25;
    if (shaftRef.current) {
      shaftRef.current.rotation.x += rotSpeed;
    }
    if (rotorRef.current) {
      rotorRef.current.rotation.x += rotSpeed;
    }

    // Micro-vibration effect on the entire motor body when vibration proxy is elevated
    if (groupRef.current) {
      if (vibration > 0.45) {
        const vibFactor = (vibration - 0.4) * 0.05;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 60) * vibFactor;
        groupRef.current.position.x = Math.cos(state.clock.elapsedTime * 50) * vibFactor;
      } else {
        groupRef.current.position.set(0, 0, 0);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* --- Main Cylindrical Stator Housing --- */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.0, 1.0, 2.2, 32]} />
        <meshStandardMaterial 
          color={getHousingColor()} 
          metalness={0.65} 
          roughness={0.35} 
        />
      </mesh>

      {/* --- Radial Cooling Fins --- */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh 
            key={i} 
            position={[0, Math.sin(angle) * 1.08, Math.cos(angle) * 1.08]} 
            rotation={[angle, 0, 0]}
          >
            <boxGeometry args={[2.0, 0.05, 0.2]} />
            <meshStandardMaterial 
              color={getFinColor()} 
              metalness={0.5} 
              roughness={0.4} 
            />
          </mesh>
        );
      })}

      {/* --- Drive End Cap (Front Bearing Housing) --- */}
      <mesh position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.02, 1.02, 0.2, 32]} />
        <meshStandardMaterial color="#27272A" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* --- Non-Drive End Cap (Rear Fan Cowl) --- */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.98, 0.98, 0.35, 32]} />
        <meshStandardMaterial color="#202024" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Rear fan ventilation grill slots */}
      <mesh position={[-1.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.9, 0.9, 0.05, 16]} />
        <meshStandardMaterial color="#0A0A0C" wireframe={true} />
      </mesh>

      {/* --- Rotating Output Drive Shaft --- */}
      <mesh ref={shaftRef} position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 24]} />
        <meshStandardMaterial color="#D4D4D8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Keyway slot on shaft */}
      <mesh position={[1.65, 0.2, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.06]} />
        <meshStandardMaterial color="#52525B" metalness={0.8} />
      </mesh>

      {/* --- Electrical Terminal Connection Box (Conduit Top) --- */}
      <group position={[0, 1.25, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.45, 0.6]} />
          <meshStandardMaterial color="#202024" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Terminal Box Cover Lid */}
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.74, 0.06, 0.64]} />
          <meshStandardMaterial color="#27272A" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Cable gland conduit port */}
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
          <meshStandardMaterial color="#71717A" metalness={0.8} />
        </mesh>
      </group>

      {/* --- Heavy-Duty Mounting Feet & Baseplate --- */}
      <mesh position={[0, -1.15, 0]}>
        <boxGeometry args={[1.8, 0.18, 1.6]} />
        <meshStandardMaterial color="#141417" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Mounting Bolt Holes / Flanges */}
      {[-0.75, 0.75].map((x) =>
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -1.2, z]}>
            <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
            <meshStandardMaterial color="#71717A" metalness={0.8} roughness={0.2} />
          </mesh>
        ))
      )}

      {/* --- Nameplate / Rating Badge --- */}
      <mesh position={[0, 0, 1.02]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color="#A1A1AA" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
