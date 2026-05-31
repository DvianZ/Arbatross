/**
 * Mission Configuration — Project Arbatross
 * Central config for all mission parameters.
 * Change LAUNCH_DATE here to update the entire dashboard.
 */

export const MISSION = {
  name: 'ARBATROSS',
  designation: 'ARBA-SAT-01',
  fullName: 'ArbaLabs Orbital Demonstration Mission',
  description: 'Edge AI verification payload aboard Korean National Space Agency launch vehicle',
  
  // ⚙️ CHANGE THIS to update the countdown
  launchDate: '1998-11-20T06:40:00Z',
  
  // Orbit parameters (LEO, similar to ISS)
  orbit: {
    altitude: 408, // km
    inclination: 51.6, // degrees
    period: 92.68, // minutes
    velocity: 7.66, // km/s
    apogee: 422, // km
    perigee: 418, // km
  },

  // Mission phases
  phases: [
    { id: 'pre-launch', label: 'PRE-LAUNCH', start: null, end: '1998-11-20T06:40:00Z', color: '#4A9EFF' },
    { id: 'launch', label: 'LAUNCH', start: '1998-11-20T06:40:00Z', end: '1998-11-20T06:55:00Z', color: '#FF5252' },
    { id: 'orbit-insertion', label: 'ORBIT INSERTION', start: '1998-11-20T06:55:00Z', end: '1998-11-20T08:10:00Z', color: '#FFB74D' },
    { id: 'orbital-ops', label: 'ORBITAL OPERATIONS', start: '1998-11-20T08:10:00Z', end: '2030-12-31T23:59:59Z', color: '#00E676' },
    { id: 'decommission', label: 'DECOMMISSION', start: '2030-12-31T23:59:59Z', end: null, color: '#B7C1DD' },
  ],
  
  // Data source attribution
  dataSource: {
    name: 'JPL Horizons System — ISS Ephemeris',
    description: 'Real International Space Station orbital data used for simulation',
    url: 'https://ssd.jpl.nasa.gov/horizons/',
  },

  // ArbaLabs info
  org: {
    name: 'ArbaLabs',
    tagline: 'Infrastructure for verifiable AI execution',
    website: 'https://www.arbalabs.com',
  }
};

export function getMissionPhase(now = new Date()) {
  const ts = now.getTime();
  for (const phase of MISSION.phases) {
    const start = phase.start ? new Date(phase.start).getTime() : -Infinity;
    const end = phase.end ? new Date(phase.end).getTime() : Infinity;
    if (ts >= start && ts < end) return phase;
  }
  return MISSION.phases[0];
}

export function getCountdown(now = new Date()) {
  const launch = new Date(MISSION.launchDate).getTime();
  const diff = launch - now.getTime();
  const isPreLaunch = diff > 0;
  const absDiff = Math.abs(diff);
  
  const days = Math.floor(absDiff / 86400000);
  const hours = Math.floor((absDiff % 86400000) / 3600000);
  const minutes = Math.floor((absDiff % 3600000) / 60000);
  const seconds = Math.floor((absDiff % 60000) / 1000);
  
  return {
    isPreLaunch,
    prefix: isPreLaunch ? 'T-' : 'T+',
    days, hours, minutes, seconds,
    totalMs: diff,
  };
}
