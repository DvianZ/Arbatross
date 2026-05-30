'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import MissionCountdown from '../components/MissionCountdown';
import VerificationPanel from '../components/VerificationPanel';
import TelemetryPanel from '../components/TelemetryPanel';
import OrbitalMap2D from '../components/OrbitalMap2D';
import { useMission } from '../context/MissionContext';

// Dynamic import for 3D globe (needs browser APIs)
const OrbitalGlobe = dynamic(() => import('../components/OrbitalGlobe'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040608', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(74,158,255,0.2)',
          borderTopColor: '#4A9EFF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <span style={{
          color: 'var(--muted)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '1px',
        }}>
          LOADING ORBITAL DATA...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  ),
});

import * as satellite from 'satellite.js';

export default function Home() {
  const { activeView, setActiveView, launchDate } = useMission();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Reset index and loop count when launchDate changes (handled during render)
  const [prevLaunchDate, setPrevLaunchDate] = useState(launchDate);
  if (launchDate !== prevLaunchDate) {
    setPrevLaunchDate(launchDate);
    setCurrentIndex(0);
    setLoopCount(0);
  }

  // Handle mobile screen size and disable split view
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && activeView === 'split') {
        setActiveView('2d');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView, setActiveView]);

  // Generate a mathematically perfect closed 3D circular orbit around the Earth's center
  // with standard ISS inclination of 51.6 degrees
  const orbitData = useMemo(() => {
    // Reference launchDate to trigger orbit dataset initialization on user settings overrides
    const _ = launchDate;
    const pointsCount = 100;
    const generatedData = [];
    const nowTime = new Date();
    const inclinationRad = (51.6 * Math.PI) / 180;

    for (let i = 0; i <= pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;

      // 3D coordinates on inclined orbital plane centered at (0,0,0)
      const x = Math.cos(angle);
      const y = Math.sin(angle) * Math.sin(inclinationRad);
      const z = Math.sin(angle) * Math.cos(inclinationRad);

      // Convert tilted 3D coordinates to geodetic lat/lon
      const r = Math.sqrt(x * x + y * y + z * z);
      const lat = Math.asin(y / r) * (180 / Math.PI);
      const lon = Math.atan2(z, x) * (180 / Math.PI);

      generatedData.push({
        lat,
        lon,
        alt: 420,
        vel: 7.66,
        cnst: lat > 0 ? 'Northern Hemi' : 'Southern Hemi',
        t: new Date(nowTime.getTime() + i * 60 * 1000).toISOString()
      });
    }
    return generatedData;
  }, [launchDate]);

  // Active playhead stepping loop (1 second per orbital minute step)
  useEffect(() => {
    if (!orbitData.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= orbitData.length) {
          setLoopCount((l) => l + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orbitData.length]);

  // Synchronize simulatedTime with playhead state dynamically
  const simulatedTime = useMemo(() => {
    if (!orbitData.length || !orbitData[0]) return '';
    const baseTime = new Date(orbitData[0].t).getTime();
    const intervalMs = 60 * 1000;
    const totalLoopMs = (orbitData.length - 1) * intervalMs;
    const elapsedMs = (currentIndex * intervalMs) + (loopCount * totalLoopMs);
    return new Date(baseTime + elapsedMs).toISOString();
  }, [orbitData, currentIndex, loopCount]);

  // Standard ISS TLE Elements from NORAD
  const TLE_LINE1 = '1 25544U 98067A   26150.48512140  .00015948  00000-0  28253-3 0  9997';
  const TLE_LINE2 = '2 25544  51.6418 139.5432 0005424  27.5834 152.4143 15.49540777139540';

  return (
    <>
      <Navbar />
      <div className="dashboard">
        {/* Left Column — Countdown + Verification */}
        <div className="dashboard__left">
          <MissionCountdown />
          <VerificationPanel />
        </div>

        {/* Center — Orbital Visualization Workspace */}
        <div className="dashboard__center">
          <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="panel__header">
              <span className="panel__title">ORBITAL VISUALIZATION</span>
              
              {/* Controls Toolbar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* View Selector */}
                <div style={{ display: 'flex', gap: '2px', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', padding: '2px', background: 'var(--bg-deep)' }}>
                  <button 
                    className={`globe-controls__btn ${activeView === '3d' ? 'globe-controls__btn--active' : ''}`}
                    style={{ padding: '3px 8px', border: 'none', borderRadius: '4px' }}
                    onClick={() => setActiveView('3d')}
                  >
                    3D
                  </button>
                  <button 
                    className={`globe-controls__btn ${activeView === '2d' ? 'globe-controls__btn--active' : ''}`}
                    style={{ padding: '3px 8px', border: 'none', borderRadius: '4px' }}
                    onClick={() => setActiveView('2d')}
                  >
                    2D
                  </button>
                  {!isMobile && (
                    <button 
                      className={`globe-controls__btn ${activeView === 'split' ? 'globe-controls__btn--active' : ''}`}
                      style={{ padding: '3px 8px', border: 'none', borderRadius: '4px' }}
                      onClick={() => setActiveView('split')}
                    >
                      SPLIT
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Viewport render target */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, background: '#040608' }}>
              {(activeView === '3d' || activeView === 'split') && (
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  <OrbitalGlobe 
                    orbitData={orbitData}
                    currentIndex={currentIndex}
                    simulatedTime={simulatedTime}
                  />
                </div>
              )}
              
              {(activeView === '2d' || activeView === 'split') && (
                <div style={{ flex: 1, position: 'relative', height: '100%', borderLeft: activeView === 'split' ? '1px solid var(--panel-border)' : 'none' }}>
                  <OrbitalMap2D 
                    orbitData={orbitData}
                    currentIndex={currentIndex}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Telemetry */}
        <div className="dashboard__right">
          <TelemetryPanel />
        </div>
      </div>
    </>
  );
}
