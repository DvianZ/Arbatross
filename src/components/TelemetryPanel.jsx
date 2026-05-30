'use client';

import { useState, useEffect, useRef } from 'react';
import { generateTelemetry, generateTelemetryHistory } from '../lib/telemetrySimulator';

function Sparkline({ data, color = '#4A9EFF', height = 28 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Draw fill
    ctx.beginPath();
    ctx.moveTo(0, rect.height);
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * rect.width;
      const y = rect.height - ((val - min) / range) * (rect.height - 4) - 2;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(rect.width, rect.height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, color + '25');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * rect.width;
      const y = rect.height - ((val - min) / range) * (rect.height - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw last point
    const lastX = rect.width;
    const lastY = rect.height - ((data[data.length - 1] - min) / range) * (rect.height - 4) - 2;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [data, color, height]);

  return (
    <canvas
      ref={canvasRef}
      className="telem-card__sparkline"
      style={{ width: '100%', height }}
    />
  );
}

const METRIC_COLORS = {
  solarPower: '#FFB74D',
  batteryLevel: '#00E676',
  cpuTemp: '#FF5252',
  panelTemp: '#FF8A65',
  signalStrength: '#4A9EFF',
  dataRate: '#00FFD0',
  altitude: '#7C4DFF',
  velocity: '#4A9EFF',
  aiInferences: '#00FFD0',
  verificationHash: '#00FFD0',
};

export default function TelemetryPanel() {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState(() => {
    // Initialize history lazily on first render
    const hist = generateTelemetryHistory(40);
    const histByMetric = {};
    const metrics = ['solarPower', 'batteryLevel', 'cpuTemp', 'signalStrength', 'altitude', 'velocity', 'aiInferences'];
    metrics.forEach((m) => {
      histByMetric[m] = hist.map((h) => h[m]);
    });
    return histByMetric;
  });

  useEffect(() => {
    const metrics = ['solarPower', 'batteryLevel', 'cpuTemp', 'signalStrength', 'altitude', 'velocity', 'aiInferences'];
    
    function tick() {
      const t = generateTelemetry();
      setTelemetry(t);

      // Update history
      setHistory((prev) => {
        const next = { ...prev };
        metrics.forEach((m) => {
          if (next[m]) {
            next[m] = [...next[m].slice(-39), t[m]?.value ?? t[m]];
          }
        });
        return next;
      });
    }

    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  if (!telemetry) return null;

  const displayMetrics = [
    'solarPower',
    'batteryLevel',
    'cpuTemp',
    'signalStrength',
    'dataRate',
    'altitude',
    'velocity',
    'aiInferences',
    'verificationHash',
  ];

  return (
    <div className="panel" style={{ flex: 1, overflow: 'auto' }}>
      <div className="panel__header">
        <span className="panel__title">Telemetry</span>
        <span className="panel__badge panel__badge--nominal">LIVE</span>
      </div>

      <div>
        {displayMetrics.map((key) => {
          const metric = telemetry[key];
          if (!metric) return null;

          const isHash = key === 'verificationHash';
          const color = METRIC_COLORS[key] || '#4A9EFF';

          return (
            <div key={key} className="telem-card">
              <div className="telem-card__header">
                <span className="telem-card__label">{metric.label}</span>
                <span className={`telem-card__status telem-card__status--${metric.status}`}>
                  {metric.status}
                </span>
              </div>
              <div className="telem-card__value-row">
                <span className="telem-card__value" style={isHash ? { fontSize: '14px' } : {}}>
                  {isHash ? metric.value : (typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value)}
                </span>
                {!isHash && <span className="telem-card__unit">{metric.unit}</span>}
              </div>
              {!isHash && history[key] && (
                <Sparkline data={history[key]} color={color} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
