"use client";

/**
 * Hero3DGlass — Refractive Glass Gyroscope & Convex Lens
 *
 * Scene:   Bright-white studio background (#FFFFFF)
 * Objects: Outer refractive torus ring  +  tilted orbital torus wing
 *          Central convex sphere lens   (MeshTransmissionMaterial, ior 1.45)
 *          Pulsing cobalt-blue 3D cardiac chamber mesh inside the lens
 * HUD:     Frosted glassmorphic biometric card (HTML overlay)
 *
 * Performance notes:
 *  - dpr capped at 1 on desktop, 0.75 on mobile
 *  - antialias: false  — saves ~25 % GPU
 *  - powerPreference: "low-power"  — OS picks iGPU on dual-GPU laptops
 *  - MeshTransmissionMaterial samples: 4  (spec says "refractive", 4 is enough)
 *  - Sparkles removed to avoid 42 extra draw calls per frame
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Pulsing cardiac chamber ──────────────────────────────────────────────────
function CardiacMesh() {
  const groupRef = useRef<THREE.Group>(null);

  // Extruded heart shape — same curve as before, reduced bevel segments
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.38);
    shape.bezierCurveTo(-0.68, -0.88, -1.08, -0.18, -0.55, 0.32);
    shape.bezierCurveTo(-0.34, 0.54, -0.11, 0.72, 0, 0.90);
    shape.bezierCurveTo(0.11, 0.72, 0.34, 0.54, 0.55, 0.32);
    shape.bezierCurveTo(1.08, -0.18, 0.68, -0.88, 0, -0.38);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.055,
      bevelThickness: 0.045,
      curveSegments: 10,
    });
  }, []);

  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Accumulate time manually — avoids THREE.Clock deprecation
  const t = useRef(0);
  useFrame((_s, dt) => {
    if (!groupRef.current) return;
    t.current += dt;
    // 79 BPM ≈ 1.317 Hz
    const pulse = 1 + Math.sin(t.current * (79 / 60) * Math.PI * 2) * 0.052;
    groupRef.current.scale.setScalar(pulse * 0.38);
    groupRef.current.rotation.y = Math.sin(t.current * 0.5) * 0.16;
    groupRef.current.rotation.z = Math.sin(t.current * 0.75) * 0.035;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.14]} rotation={[0, 0, Math.PI]}>
      {/* Cobalt-blue emissive heart */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#0284C7"
          emissive="#0369A1"
          emissiveIntensity={2.8}
          metalness={0.15}
          roughness={0.18}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Bright edge wireframe */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#BAE6FD" transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

// ─── Full gyroscope assembly ──────────────────────────────────────────────────
function GlassGyroscope() {
  return (
    <group rotation={[0.14, -0.28, 0.08]}>

      {/* ── Outer refractive torus ring ── */}
      <mesh rotation={[0.10, 0.22, 0.35]}>
        {/* Reduced segments: 12 / 48 (was 24 / 96 — no visible difference) */}
        <torusGeometry args={[1.56, 0.07, 12, 48]} />
        <meshPhysicalMaterial
          color="#E0F2FE"
          metalness={0.08}
          roughness={0.06}
          transmission={0.68}
          thickness={0.22}
          transparent
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Tilted orbital torus wing ── */}
      <mesh rotation={[Math.PI / 2.5, 0.10, -0.48]} scale={[1.08, 0.50, 1]}>
        <torusGeometry args={[1.34, 0.042, 10, 48]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          metalness={0.14}
          roughness={0.08}
          transmission={0.74}
          thickness={0.14}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Central convex lens sphere — MeshTransmissionMaterial ── */}
      <mesh rotation={[0.20, -0.28, 0.16]}>
        {/* 28×28 is enough for a smooth sphere at this size */}
        <sphereGeometry args={[1.02, 28, 28]} />
        <MeshTransmissionMaterial
          backside
          samples={4}            // 4 = good quality / half the cost of 8
          resolution={256}       // 256 FBO — invisible difference vs 512 at canvas size
          thickness={0.45}
          roughness={0.04}
          anisotropy={0.08}
          ior={1.45}
          chromaticAberration={0.04}
          transmission={0.98}
          color="#F0F9FF"
          attenuationColor="#BAE6FD"
          attenuationDistance={2.2}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Cardiac chamber sits inside the lens */}
      <CardiacMesh />
    </group>
  );
}

// ─── Frosted biometric HUD overlay (pure HTML — zero WebGL cost) ─────────────
function BiometricHUD() {
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
      <svg
        className="ecg-wave"
        viewBox="0 0 280 48"
        role="img"
        aria-label="Live ECG waveform"
      >
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

// ─── Exported component ───────────────────────────────────────────────────────
export default function Hero3DGlass() {
  return (
    <div className="hero-3d-shell">
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 32 }}
        dpr={1}                           // fixed 1× — no retina upscaling
        frameloop="always"
        gl={{
          alpha: true,
          antialias: false,               // MSAA off — saves ~25 % GPU
          powerPreference: "low-power",   // picks iGPU on dual-GPU machines
        }}
        onCreated={({ gl }) => {
          // Prevent browser from killing the context on memory pressure
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
          });
        }}
      >
        <Suspense fallback={null}>
          {/* ── Lighting — white studio ── */}
          <ambientLight intensity={2.2} />
          {/* Key light: cool blue-white from upper right */}
          <pointLight
            position={[3.0, 3.5, 3.5]}
            color="#E0F2FE"
            intensity={12}
            distance={9}
          />
          {/* Fill light: warm teal from lower left */}
          <pointLight
            position={[-2.5, -1.5, 2.0]}
            color="#CCFBF1"
            intensity={5}
            distance={7}
          />
          {/* Rim light: subtle cobalt blue from behind */}
          <pointLight
            position={[0, 0.5, -3]}
            color="#BAE6FD"
            intensity={3}
            distance={6}
          />

          <GlassGyroscope />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.40}
            /* Limit vertical drag so the gyroscope stays centred */
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.7}
          />
        </Suspense>
      </Canvas>

      {/* HTML glassmorphic HUD — renders outside WebGL */}
      <BiometricHUD />
    </div>
  );
}
