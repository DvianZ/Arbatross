/**
 * Telemetry Simulator — Generates realistic-looking mission telemetry
 * Based on typical LEO satellite operational parameters.
 */

// Seeded pseudo-random for consistent values per tick
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function oscillate(time, period, min, max, phase = 0) {
  const t = Math.sin((time / period + phase) * Math.PI * 2) * 0.5 + 0.5;
  return lerp(min, max, t);
}

export function generateTelemetry(timestamp = Date.now()) {
  const t = timestamp / 1000; // seconds
  const seed = Math.floor(t / 5); // update every 5 seconds for readable values
  
  // Solar panel illumination cycle (~92 min orbit, ~35 min eclipse)
  const orbitPhase = (t % (92.68 * 60)) / (92.68 * 60);
  const inSunlight = orbitPhase < 0.62;
  
  return {
    // Power subsystem
    solarPower: {
      label: 'Solar Array Power',
      value: inSunlight 
        ? oscillate(t, 300, 85, 120, 0.3) + seededRandom(seed) * 5
        : seededRandom(seed + 1) * 2,
      unit: 'W',
      min: 0,
      max: 130,
      status: inSunlight ? 'nominal' : 'standby',
    },
    batteryLevel: {
      label: 'Battery Level',
      value: inSunlight
        ? oscillate(t, 5500, 78, 98, 0.1) + seededRandom(seed + 2) * 3
        : oscillate(t, 5500, 35, 78, 0.1) - seededRandom(seed + 3) * 5,
      unit: '%',
      min: 0,
      max: 100,
      status: 'nominal',
    },
    
    // Thermal
    cpuTemp: {
      label: 'Edge AI Processor',
      value: oscillate(t, 800, 32, 58, 0.5) + seededRandom(seed + 4) * 4,
      unit: '°C',
      min: -20,
      max: 80,
      status: 'nominal',
    },
    panelTemp: {
      label: 'Panel Temperature',
      value: inSunlight
        ? oscillate(t, 400, 45, 85, 0.2) + seededRandom(seed + 5) * 8
        : oscillate(t, 400, -40, 10, 0.2) + seededRandom(seed + 6) * 5,
      unit: '°C',
      min: -60,
      max: 120,
      status: inSunlight ? 'nominal' : 'cold',
    },
    
    // Communications
    signalStrength: {
      label: 'Signal Strength',
      value: oscillate(t, 1200, -85, -45, 0.7) + seededRandom(seed + 7) * 10,
      unit: 'dBm',
      min: -120,
      max: -20,
      status: 'nominal',
    },
    dataRate: {
      label: 'Downlink Rate',
      value: Math.max(0, oscillate(t, 600, 0.5, 8.2, 0.4) + seededRandom(seed + 8) * 1.5),
      unit: 'Mbps',
      min: 0,
      max: 10,
      status: 'nominal',
    },
    
    // Orbital mechanics
    altitude: {
      label: 'Altitude',
      value: oscillate(t, 5500, 405, 425, 0) + seededRandom(seed + 9) * 2,
      unit: 'km',
      min: 380,
      max: 450,
      status: 'nominal',
    },
    velocity: {
      label: 'Orbital Velocity',
      value: oscillate(t, 5500, 7.62, 7.70, 0.5) + seededRandom(seed + 10) * 0.02,
      unit: 'km/s',
      min: 7.5,
      max: 7.8,
      status: 'nominal',
    },
    
    // Edge AI specific
    aiInferences: {
      label: 'AI Inferences',
      value: Math.floor(oscillate(t, 300, 120, 450, 0.8) + seededRandom(seed + 11) * 50),
      unit: '/min',
      min: 0,
      max: 500,
      status: 'nominal',
    },
    verificationHash: {
      label: 'Last Verification',
      value: generateHash(seed),
      unit: '',
      min: 0,
      max: 1,
      status: 'verified',
    },
  };
}

function generateHash(seed) {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(seededRandom(seed * 13 + i) * 16)];
  }
  return hash;
}

export function generateTelemetryHistory(points = 60) {
  const now = Date.now();
  const interval = 10000; // 10 seconds between points
  const history = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = now - i * interval;
    const telem = generateTelemetry(ts);
    history.push({
      timestamp: ts,
      solarPower: telem.solarPower.value,
      batteryLevel: telem.batteryLevel.value,
      cpuTemp: telem.cpuTemp.value,
      signalStrength: telem.signalStrength.value,
      altitude: telem.altitude.value,
      velocity: telem.velocity.value,
      aiInferences: telem.aiInferences.value,
    });
  }
  return history;
}
