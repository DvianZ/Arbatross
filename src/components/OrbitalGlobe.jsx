'use client';

import { useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MISSION } from '../lib/missionConfig';

// Suppress Three.js internal deprecation warnings from React Three Fiber
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock')) {
      return;
    }
    originalWarn(...args);
  };
}

/* ─── Earth Sphere ─── */
function Earth({ currentPoint, simulatedTime }) {
  const meshRef = useRef();

  // Load generated map texture
  const earthTexture = useTexture('/textures/earth_day.png');

  // Compute rotation angle based on the current time's Greenwich Mean Sidereal Time (GMST)
  const targetRotationY = useMemo(() => {
    const timeString = simulatedTime || (currentPoint ? currentPoint.t : null);
    if (!timeString) return -Math.PI / 2;
    const dateObj = new Date(timeString);
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const daysSinceJ2000 = (dateObj.getTime() - J2000.getTime()) / 86400000;

    // GMST in hours
    const GMST = (18.697374558 + 24.06570982441908 * daysSinceJ2000) % 24;
    // Convert hours to radians (24 hours = 2PI radians)
    // Three.js rotates counter-clockwise. Offset by -PI/2 to align 0 longitude.
    const rad = (GMST * 15 * Math.PI) / 180;
    return -rad - Math.PI / 2;
  }, [currentPoint, simulatedTime]);

  // Smoothly interpolate rotation to prevent sudden jumps
  useFrame(() => {
    if (meshRef.current) {
      // Lerp logic: current + (target - current) * factor
      const current = meshRef.current.rotation.y;

      // Handle modular wrapping differences to prevent complete reverse spins
      let diff = targetRotationY - current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));

      meshRef.current.rotation.y += diff * 0.08;
    }
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={1.02}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#4A9EFF"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#4A9EFF"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* ─── Satellite with orbit trail ─── */
function Satellite({ orbitData, currentIndex, satPosRef, onToggleFocus }) {
  const satelliteRef = useRef();
  const glowRef = useRef();

  // Load the downloaded satellite 3D model
  const { scene } = useGLTF('/models/satellite.glb');

  // Clone scene so multiple instances don't conflict
  const satModel = useMemo(() => scene.clone(), [scene]);

  // Convert lat/lon to 3D position
  const latLonToPos = useCallback((lat, lon, radius = 2.15) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, []);

  // Create orbit trail geometry
  const trailGeometry = useMemo(() => {
    if (!orbitData || orbitData.length < 2) return null;

    // Use a window of points around current index for the visible trail
    const trailLength = Math.min(80, orbitData.length);
    const startIdx = Math.max(0, currentIndex - trailLength);
    const endIdx = Math.min(orbitData.length, currentIndex + 10);

    const points = [];
    for (let i = startIdx; i < endIdx; i++) {
      const d = orbitData[i];
      points.push(latLonToPos(d.lat, d.lon));
    }

    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, points.length * 4, 0.008, 8, false);
  }, [orbitData, currentIndex, latLonToPos]);

  // Current target satellite position
  const targetSatPos = useMemo(() => {
    if (!orbitData || !orbitData[currentIndex]) return new THREE.Vector3(0, 2.15, 0);
    const d = orbitData[currentIndex];
    return latLonToPos(d.lat, d.lon);
  }, [orbitData, currentIndex, latLonToPos]);

  const currentPosRef = useRef(new THREE.Vector3(0, 2.15, 0));

  // Smoothly interpolate position using frame rate
  const [currentPos, setCurrentPos] = useState(new THREE.Vector3(0, 2.15, 0));

  useFrame((state) => {
    // Lerp our persistent coordinates
    currentPosRef.current.lerp(targetSatPos, 0.08);

    // Save position to shared ref for camera tracking
    if (satPosRef && satPosRef.current) {
      satPosRef.current.copy(currentPosRef.current);
    }

    if (satelliteRef.current) {
      satelliteRef.current.position.copy(currentPosRef.current);

      // Compute heading direction (tangent vector of movement)
      const dir = new THREE.Vector3().subVectors(targetSatPos, currentPosRef.current).normalize();

      // Only orient if we have a valid non-zero direction vector to prevent flip glitches
      if (dir.lengthSq() > 0.0001) {
        const targetLookAt = new THREE.Vector3().addVectors(currentPosRef.current, dir);
        satelliteRef.current.lookAt(targetLookAt);
      }
    }
    if (glowRef.current) {
      glowRef.current.position.copy(currentPosRef.current);
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      glowRef.current.scale.setScalar(scale);
    }
    // Update local state to trigger Html position update smoothly
    setCurrentPos(currentPosRef.current.clone());
  });

  return (
    <group>
      {/* Orbit trail */}
      {trailGeometry && (
        <mesh geometry={trailGeometry}>
          <meshBasicMaterial
            color="#00FFD0"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* 3D Model Satellite */}
      <group
        ref={satelliteRef}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleFocus) onToggleFocus();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
      >
        <primitive
          object={satModel}
          scale={0.0008} // Reduced scale for a more proportional appearance
        />
      </group>

      {/* Satellite glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#00FFD0" transparent opacity={0.2} />
      </mesh>

      {/* Satellite label */}
      <Html position={[currentPos.x, currentPos.y + 0.12, currentPos.z]} center>
        <div style={{
          color: '#00FFD0',
          fontSize: '10px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          letterSpacing: '1px',
          textShadow: '0 0 8px rgba(0, 255, 208, 0.5)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {MISSION.name}
        </div>
      </Html>
    </group>
  );
}

/* ─── Ground Track Line ─── */
function GroundTrack({ orbitData }) {
  const lineRef = useRef();

  const geometry = useMemo(() => {
    if (!orbitData || orbitData.length < 2) return null;

    // Map raw data coords to 3D positions
    const points = orbitData.map((d) => {
      const phi = (90 - d.lat) * (Math.PI / 180);
      const theta = (d.lon + 180) * (Math.PI / 180);
      const r = 2.01;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    });

    // Create a smooth closed loop spline curve interpolation across all points
    const curve = new THREE.CatmullRomCurve3(points, true);
    // Draw the curve with high resolution segments for rendering smoothness
    const subdividedPoints = curve.getPoints(points.length * 8);
    const geo = new THREE.BufferGeometry().setFromPoints(subdividedPoints);
    return geo;
  }, [orbitData]);

  if (!geometry) return null;

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#4A9EFF" transparent opacity={0.3} />
    </line>
  );
}

/* ─── Scene Setup ─── */
function Scene({
  orbitData,
  currentIndex,
  simulatedTime,
  isFocusedOnSatellite,
  setIsFocusedOnSatellite
}) {
  const currentPoint = orbitData[currentIndex] || null;
  const controlsRef = useRef();
  const satPosRef = useRef(new THREE.Vector3(0, 2.15, 0));
  const lastSatPos = useRef(new THREE.Vector3(0, 2.15, 0));
  const wasFocusedRef = useRef(false);

  useFrame((state) => {
    if (controlsRef.current) {
      if (isFocusedOnSatellite) {
        // Calculate the satellite's translation delta this frame
        const delta = new THREE.Vector3().subVectors(satPosRef.current, lastSatPos.current);
        
        // Translate the camera position by the same delta to keep the user view offset stable
        state.camera.position.add(delta);

        // Lock target to the satellite position
        controlsRef.current.target.copy(satPosRef.current);

        // Transition the camera closer (zoom in cinematic effect)
        if (!wasFocusedRef.current) {
          const dir = new THREE.Vector3().subVectors(state.camera.position, satPosRef.current).normalize();
          const targetCamPos = new THREE.Vector3().copy(satPosRef.current).add(dir.multiplyScalar(0.35));
          state.camera.position.lerp(targetCamPos, 0.08);

          if (state.camera.position.distanceTo(satPosRef.current) < 0.45) {
            wasFocusedRef.current = true;
          }
        }
      } else {
        // Smoothly return to the center of Earth
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);

        // Transition camera back to a default global view distance if it was zoomed in
        if (wasFocusedRef.current) {
          const dir = new THREE.Vector3().subVectors(state.camera.position, new THREE.Vector3(0, 0, 0)).normalize();
          const targetCamPos = dir.multiplyScalar(5.5);
          state.camera.position.lerp(targetCamPos, 0.08);
          if (state.camera.position.length() > 5.0) {
            wasFocusedRef.current = false;
          }
        }
      }
      
      // Keep track of the satellite position for the next frame
      lastSatPos.current.copy(satPosRef.current);

      controlsRef.current.update();
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -2, -5]} intensity={0.3} color="#4A9EFF" />

      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />

      <Earth
        currentPoint={currentPoint}
        simulatedTime={simulatedTime}
      />
      <GroundTrack orbitData={orbitData} />
      <Satellite
        orbitData={orbitData}
        currentIndex={currentIndex}
        satPosRef={satPosRef}
        onToggleFocus={() => setIsFocusedOnSatellite(prev => !prev)}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={isFocusedOnSatellite ? 0.05 : 3}
        maxDistance={isFocusedOnSatellite ? 2 : 12}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        autoRotate={false}
      />
    </>
  );
}

/* ─── Main Component ─── */
export default function OrbitalGlobe({
  orbitData = [],
  currentIndex = 0,
  simulatedTime = null,
}) {
  const [isFocusedOnSatellite, setIsFocusedOnSatellite] = useState(false);
  const currentPoint = orbitData[currentIndex] || null;

  return (
    <div className="globe-container" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        style={{ background: '#040608', width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene
            orbitData={orbitData}
            currentIndex={currentIndex}
            simulatedTime={simulatedTime}
            isFocusedOnSatellite={isFocusedOnSatellite}
            setIsFocusedOnSatellite={setIsFocusedOnSatellite}
          />
        </Suspense>
      </Canvas>

      {/* Camera Focus Toggle Overlay */}
      <button
        onClick={() => setIsFocusedOnSatellite((prev) => !prev)}
        className="globe-controls__btn"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(4, 6, 8, 0.85)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: '0 0 10px rgba(0, 255, 208, 0.25)',
          zIndex: 10,
          padding: '8px 14px',
          borderRadius: '4px',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'var(--accent-cyan)';
          e.target.style.color = '#000000';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(4, 6, 8, 0.85)';
          e.target.style.color = 'var(--accent-cyan)';
        }}
      >
        {isFocusedOnSatellite ? 'CENTER ON EARTH' : 'FOCUS ON SATELLITE'}
      </button>

      {/* Orbit info overlay */}
      {currentPoint && (
        <div className="orbit-info">
          <div className="orbit-info__row">
            <span className="orbit-info__key">LAT</span>
            <span className="orbit-info__val">{currentPoint.lat.toFixed(2)}°</span>
          </div>
          <div className="orbit-info__row">
            <span className="orbit-info__key">LON</span>
            <span className="orbit-info__val">{currentPoint.lon.toFixed(2)}°</span>
          </div>
          <div className="orbit-info__row">
            <span className="orbit-info__key">ALT</span>
            <span className="orbit-info__val">{currentPoint.alt.toFixed(0)} km</span>
          </div>
          <div className="orbit-info__row">
            <span className="orbit-info__key">CNST</span>
            <span className="orbit-info__val">{currentPoint.cnst}</span>
          </div>
          <div className="orbit-info__row">
            <span className="orbit-info__key">TIME</span>
            <span className="orbit-info__val" style={{ fontSize: '10px' }}>
              {new Date(simulatedTime || currentPoint.t).toISOString().replace('T', ' ').substring(0, 19)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
