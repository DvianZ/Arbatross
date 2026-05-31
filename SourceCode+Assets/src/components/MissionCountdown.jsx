'use client';

import { useState, useEffect } from 'react';
import { MISSION } from '../lib/missionConfig';
import { useMission } from '../context/MissionContext';

export default function MissionCountdown() {
  const { launchDate } = useMission();
  const [countdown, setCountdown] = useState(null);
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    function tick() {
      // Custom calculation inline to support dynamic launchDate
      const launch = new Date(launchDate).getTime();
      const now = new Date().getTime();
      const diff = launch - now;
      const isPreLaunch = diff > 0;
      const absDiff = Math.abs(diff);
      
      const days = Math.floor(absDiff / 86400000);
      const hours = Math.floor((absDiff % 86400000) / 3600000);
      const minutes = Math.floor((absDiff % 3600000) / 60000);
      const seconds = Math.floor((absDiff % 60000) / 1000);

      setCountdown({
        isPreLaunch,
        prefix: isPreLaunch ? 'T-' : 'T+',
        days, hours, minutes, seconds
      });

      // Get phase state matching current date config
      const ts = new Date().getTime();
      const launchTs = new Date(launchDate).getTime();
      if (ts < launchTs) {
        setPhase({ label: 'PRE-LAUNCH', color: '#4A9EFF' });
      } else if (ts >= launchTs && ts < launchTs + 15 * 60 * 1000) {
        setPhase({ label: 'LAUNCH', color: '#FF5252' });
      } else if (ts >= launchTs + 15 * 60 * 1000 && ts < launchTs + 90 * 60 * 1000) {
        setPhase({ label: 'ORBIT INSERTION', color: '#FFB74D' });
      } else if (ts >= launchTs + 90 * 60 * 1000 && ts < new Date('2027-01-15T00:00:00Z').getTime()) {
        setPhase({ label: 'ORBITAL OPERATIONS', color: '#00E676' });
      } else {
        setPhase({ label: 'DECOMMISSION', color: '#B7C1DD' });
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  if (!countdown) return null;

  // Ring progress: percentage of time elapsed in current day cycle
  const dayProgress = 1 - ((countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds) / 86400);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - dayProgress);

  const parsedLaunchDate = new Date(launchDate);
  const formattedDate = parsedLaunchDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = parsedLaunchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">Mission Countdown</span>
        <span
          className={`panel__badge ${countdown.isPreLaunch ? 'panel__badge--nominal' : 'panel__badge--nominal'}`}
          style={{ color: countdown.isPreLaunch ? 'var(--accent-cyan)' : 'var(--success)', background: countdown.isPreLaunch ? 'var(--accent-cyan-glow)' : 'var(--success-glow)' }}
        >
          {countdown.isPreLaunch ? 'ACTIVE' : 'LAUNCHED'}
        </span>
      </div>

      <div className="countdown">
        <div className="countdown__phase" style={{ color: phase?.color }}>
          {phase?.label}
        </div>
        <div className="countdown__mission-name">{MISSION.name}</div>
        <div className="countdown__designation">{MISSION.designation}</div>

        {/* Animated Ring */}
        <div className="countdown__ring">
          <svg viewBox="0 0 200 200">
            <circle className="countdown__ring-bg" cx="100" cy="100" r="90" />
            <circle
              className="countdown__ring-progress"
              cx="100"
              cy="100"
              r="90"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ stroke: phase?.color || 'var(--accent)' }}
            />
          </svg>
          <div className="countdown__ring-inner">
            <div className="countdown__prefix">{countdown.prefix}</div>
            <div className="countdown__time">
              {String(countdown.days).padStart(2, '0')}:{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
            </div>
            <div className="countdown__label">
              {countdown.isPreLaunch ? 'Until Launch' : 'Mission Elapsed'}
            </div>
          </div>
        </div>


        <div className="countdown__date">
          {formattedDate} — {formattedTime}
        </div>
      </div>
    </div>
  );
}
