'use client';

import { useState, useEffect } from 'react';
import { MISSION } from '../lib/missionConfig';
import { useMission } from '../context/MissionContext';

export default function Navbar() {
  const { launchDate, setLaunchDate } = useMission();
  const [utcTime, setUtcTime] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Adjust pre-launch phase check using dynamic launchDate
  const getDynamicMissionPhase = () => {
    const ts = new Date().getTime();
    const launchTs = new Date(launchDate).getTime();
    if (ts < launchTs) {
      return { label: 'PRE-LAUNCH', color: '#4A9EFF' };
    } else if (ts >= launchTs && ts < launchTs + 15 * 60 * 1000) {
      return { label: 'LAUNCH', color: '#FF5252' };
    } else if (ts >= launchTs + 15 * 60 * 1000 && ts < launchTs + 90 * 60 * 1000) {
      return { label: 'ORBIT INSERTION', color: '#FFB74D' };
    } else if (ts >= launchTs + 90 * 60 * 1000 && ts < new Date('2027-01-15T00:00:00Z').getTime()) {
      return { label: 'ORBITAL OPERATIONS', color: '#00E676' };
    } else {
      return { label: 'DECOMMISSION', color: '#B7C1DD' };
    }
  };

  const phase = getDynamicMissionPhase();

  const handleSave = (e) => {
    e.preventDefault();
    if (tempDate) {
      // Ensure ISO string representation
      setLaunchDate(new Date(tempDate).toISOString());
      setIsAdminOpen(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ArbaLabs" className="navbar__logo" />
          <div className="navbar__divider" />
          <div className="navbar__mission">
            <span className="navbar__mission-name">{MISSION.name}</span>
          </div>
        </div>

        <div className="navbar__right">
          <span className="navbar__time">{utcTime}</span>
          <span className="navbar__data-source" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 255, 208, 0.2)' }}>NASA-inspired Orbital Mission Interface</span>
          <span className="navbar__data-source">ISS Ephemeris / JPL Horizons</span>
          
          <button 
            className="globe-controls__btn" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
            onClick={() => {
              setTempDate(launchDate.substring(0, 16)); // YYYY-MM-DDTHH:mm
              setIsAdminOpen(true);
            }}
            title="Configure Mission Launch Date"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Admin Panel Modal Overlay */}
      {isAdminOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 6, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}>
          <div className="panel" style={{ width: '380px', padding: '20px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '14px', letterSpacing: '1px', color: 'var(--text)' }}>MISSION CONFIGURATION</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Set launch countdown threshold. This dynamically recalibrates MET timers and visual overlays.
            </p>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Launch Target (UTC / Local)</label>
                <input 
                  type="datetime-local" 
                  value={tempDate} 
                  onChange={(e) => setTempDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="globe-controls__btn" 
                  onClick={() => setIsAdminOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="globe-controls__btn globe-controls__btn--active"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
