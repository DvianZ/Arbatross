'use client';

import { useState, useEffect, useRef } from 'react';
import { MISSION } from '../lib/missionConfig';

export default function OrbitalMap2D({ orbitData = [], currentIndex = 0 }) {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const earthImgRef = useRef(null);

  // Load the real Earth texture image
  useEffect(() => {
    const img = new Image();
    img.src = '/textures/earth_day.png';
    img.onload = () => {
      earthImgRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !orbitData.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Calculate maximum 4:3 dimensions that fit in the container
    let W = rect.width;
    let H = rect.height;
    const ratio = 4 / 3;
    if (W / H > ratio) {
      W = H * ratio;
    } else {
      H = W / ratio;
    }

    // Offset to center the map
    const offsetX = (rect.width - W) / 2;
    const offsetY = (rect.height - H) / 2;

    // Clear entire canvas
    ctx.fillStyle = '#040608';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Draw the real Earth image if loaded
    if (earthImgRef.current) {
      ctx.drawImage(earthImgRef.current, 0, 0, W, H);
      // Dark semi-transparent tint overlay to match the high-contrast dashboard aesthetic
      ctx.fillStyle = 'rgba(4, 6, 8, 0.45)';
      ctx.fillRect(0, 0, W, H);
    }

    // Lat/lon to pixel
    const toXY = (lat, lon) => ({
      x: ((lon + 180) / 360) * W,
      y: ((90 - lat) / 180) * H,
    });

    // Draw grid
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Equator
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.12)';
    ctx.lineWidth = 1;
    const eqY = H / 2;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(W, eqY);
    ctx.stroke();

    // Draw ground track
    const trailLen = Math.min(80, orbitData.length);
    const startIdx = Math.max(0, currentIndex - trailLen);

    // Track line segments (handle wraparound)
    ctx.lineWidth = 1.5;
    for (let i = startIdx + 1; i <= Math.min(currentIndex, orbitData.length - 1); i++) {
      const prev = orbitData[i - 1];
      const curr = orbitData[i];
      const p1 = toXY(prev.lat, prev.lon);
      const p2 = toXY(curr.lat, curr.lon);

      // Skip if crossing the antimeridian
      if (Math.abs(curr.lon - prev.lon) > 180) continue;

      const alpha = (i - startIdx) / trailLen;
      ctx.strokeStyle = `rgba(0, 255, 208, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw future track (faded)
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 30, orbitData.length); i++) {
      const prev = orbitData[i - 1];
      const curr = orbitData[i];
      if (Math.abs(curr.lon - prev.lon) > 180) continue;
      const p1 = toXY(prev.lat, prev.lon);
      const p2 = toXY(curr.lat, curr.lon);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw satellite position
    const sat = orbitData[currentIndex];
    if (sat) {
      const sp = toXY(sat.lat, sat.lon);

      // Glow
      const glow = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 20);
      glow.addColorStop(0, 'rgba(0, 255, 208, 0.4)');
      glow.addColorStop(1, 'rgba(0, 255, 208, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.fillStyle = '#00FFD0';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#00FFD0';
      ctx.font = "600 10px 'JetBrains Mono', monospace";
      ctx.fillText(MISSION.name, sp.x + 8, sp.y - 8);

      // Coordinate text
      ctx.fillStyle = 'rgba(183, 193, 221, 0.7)';
      ctx.font = "400 9px 'JetBrains Mono', monospace";
      ctx.fillText(`${sat.lat.toFixed(1)}° ${sat.lon.toFixed(1)}°`, sp.x + 8, sp.y + 4);
    }

    // Axis labels
    ctx.fillStyle = 'rgba(122, 134, 166, 0.5)';
    ctx.font = "400 9px 'Space Grotesk', sans-serif";
    ctx.fillText('180°W', 4, H - 4);
    ctx.fillText('0°', W / 2 - 6, H - 4);
    ctx.fillText('180°E', W - 30, H - 4);
    ctx.fillText('90°N', 4, 12);
    ctx.fillText('90°S', 4, H - 14);

    ctx.restore();

  }, [orbitData, currentIndex, imageLoaded]);

  return (
    <div className="map2d" style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
