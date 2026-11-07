"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Heart mesh (pulsing core) ────────────────────────────────────────────────
function HeartMesh() {
  const heartRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.42);
    shape.bezierCurveTo(-0.72, -0.92, -1.12, -0.2, -0.58, 0.34);
    shape.bezierCurveTo(-0.36, 0.57, -0.12, 0.75, 0, 0.94);
    shape.bezierCurveTo(0.12, 0.75, 0.36, 0.57, 0.58, 0.34);
    shape.bezierCurveTo(1.12, -0.2, 0.72, -0.92, 0, -0.42);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 2,   // ↓ was 4
      bevelSize: 0.06,
      bevelThickness: 0.05,
      curveSegments: 10,  // ↓ was 16
    });
  }, []);

  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  const elapsed = useRef(0);
  useFrame((_state, delta) => {
    if (!heartRef.current) return;
    elapsed.current += delta;
    const t = elapsed.current;
    const pulse = 1 + Math.sin(t * (79 / 60) * Math.PI * 2) * 0.055;
    heartRef.current.scale.setScalar(pulse * 0.42);
    heartRef.current.rotation.y = Math.sin(t * 0.55) * 0.18;
    heartRef.current.rotation.z = Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group ref={heartRef} position={[0, 0, 0.28]} rotation={[0, 0, Math.PI]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.6}
          metalness={0.18}
          roughness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#bae6fd" transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

// ─── Gyroscope rings + sphere — CHEAP materials only ─────────────────────────
// MeshTransmissionMaterial was removed (it re-renders the whole scene every
// frame at 512px into an off-screen FBO — the #1 freeze cause).
// Replaced with meshPhysicalMaterial at low cost settings.
function GlassGyroscope() {
  return (
    <group rotation={[0.16, -0.32, 0.1]}>
      {/* Outer ring */}
      <mesh rotation={[0.12, 0.25, 0.38]}>
        <torusGeometry args={[1.52, 0.075, 12, 48]} /> {/* ↓ 24→12, 96→48 */}
        <meshPhysicalMaterial
          color="#dbeafe"
          metalness={0.12}
          roughness={0.08}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2.6, 0.12, -0.5]} scale={[1.1, 0.52, 1]}>
        <torusGeometry args={[1.3, 0.045, 10, 48]} /> {/* ↓ 18→10, 96→48 */}
        <meshPhysicalMaterial
          color="#7dd3fc"
          metalness={0.18}
          roughness={0.1}
          transparent
          opacity={0.72}
        />
      </mesh>

      {/* Central sphere — cheap glass look, NO FBO / transmission */}
      <mesh rotation={[0.22, -0.3, 0.18]}>
        <sphereGeometry args={[0.98, 24, 24]} /> {/* ↓ 64,64 → 24,24 */}
        <meshPhysicalMaterial
          color="#dbeafe"
          metalness={0.05}
          roughness={0.0}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      <HeartMesh />
    </group>
  );
}

// ─── HTML telemetry overlay ───────────────────────────────────────────────────
function TelemetryCard() {
  return (
    <div className="telemetry-card" aria-label="Live cardiac telemetry">
      <div className="telemetry-heading">
        <span className="telemetry-heart" aria-hidden="true">♥</span>
        <span>LIVE PATIENT SIGNAL</span>
      </div>
      <div className="telemetry-value">
        <strong>79</strong>
        <span>BPM</span>
      </div>
      <svg className="ecg-wave" viewBox="0 0 280 48" role="img" aria-label="Live ECG waveform">
        <polyline
          className="ecg-line"
          points="0,27 32,27 43,27 51,11 59,39 67,27 94,27 105,27 113,19 119,32 126,27 157,27 168,27 178,7 187,42 196,27 225,27 237,27 247,17 254,34 263,27 280,27"
        />
      </svg>
      <div className="telemetry-footer">
        <span>Stable rhythm</span>
        <span className="telemetry-dot" />
        <span>Encrypted</span>
      </div>
    </div>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
export default function Hero3DGlass() {
  return (
    <div className="hero-3d-shell">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 34 }}
        dpr={1}                        // fixed 1× — no retina upscaling
        frameloop="always"
        gl={{
          alpha: true,
          antialias: false,            // MSAA off saves GPU significantly
          powerPreference: "low-power", // browser picks the iGPU on dual-GPU laptops
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
          });
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.7} />
          <pointLight position={[2.5, 2.8, 3]} color="#38bdf8" intensity={9} distance={7} />
          <pointLight position={[-2, -1, 2]} color="#0d9488" intensity={4} distance={6} />
          <GlassGyroscope />
          {/* Sparkles removed — each particle is an animated draw call every frame */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.45}   // ↓ was 0.55
          />
        </Suspense>
      </Canvas>
      <TelemetryCard />
    </div>
  );
}
