'use client';

import { useState, useEffect } from 'react';

const SYSTEMS = [
  {
    id: 'payload',
    name: 'Payload Status',
    detail: 'ArbaEdge module',
    status: 'go',
    value: 'ONLINE',
  },
  {
    id: 'comms',
    name: 'Comms Link',
    detail: 'S-band uplink',
    status: 'go',
    value: 'LOCKED',
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    detail: 'Telemetry stream',
    status: 'go',
    value: 'ACTIVE',
  },
  {
    id: 'edge-ai',
    name: 'Edge AI Module',
    detail: 'Inference engine',
    status: 'go',
    value: 'NOMINAL',
  },
  {
    id: 'ground-station',
    name: 'Ground Station',
    detail: 'Korea / Daejeon',
    status: 'go',
    value: 'CONNECTED',
  },
  {
    id: 'power',
    name: 'Power System',
    detail: 'Solar + battery',
    status: 'go',
    value: 'NOMINAL',
  },
  {
    id: 'thermal',
    name: 'Thermal Control',
    detail: 'Active heaters',
    status: 'go',
    value: 'IN RANGE',
  },
  {
    id: 'attitude',
    name: 'Attitude Control',
    detail: 'Reaction wheels',
    status: 'go',
    value: 'STABLE',
  },
];

function StatusIcon({ status }) {
  if (status === 'go') {
    return <div className="verify-item__icon verify-item__icon--go">✓</div>;
  }
  if (status === 'nogo') {
    return <div className="verify-item__icon verify-item__icon--nogo">✗</div>;
  }
  return <div className="verify-item__icon verify-item__icon--pending">○</div>;
}

export default function VerificationPanel() {
  const [systems, setSystems] = useState(SYSTEMS);
  const [animatedIdx, setAnimatedIdx] = useState(-1);

  // Simulate occasional status flicker for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setSystems((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        setAnimatedIdx(idx);
        setTimeout(() => setAnimatedIdx(-1), 300);
        return prev; // statuses stay GO for the demo
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const allGo = systems.every((s) => s.status === 'go');

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">System Verification</span>
        <span className={`panel__badge ${allGo ? 'panel__badge--nominal' : 'panel__badge--critical'}`}>
          {systems.filter((s) => s.status === 'go').length}/{systems.length}
        </span>
      </div>

      <div>
        {systems.map((sys, i) => (
          <div
            key={sys.id}
            className="verify-item"
            style={{
              opacity: animatedIdx === i ? 0.6 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <StatusIcon status={sys.status} />
            <div className="verify-item__info">
              <div className="verify-item__name">{sys.name}</div>
              <div className="verify-item__detail">{sys.detail} — {sys.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={`verify-summary ${allGo ? 'verify-summary--go' : 'verify-summary--nogo'}`}>
        <span style={{ fontSize: '18px' }}>{allGo ? '●' : '■'}</span>
        {allGo ? 'ALL SYSTEMS GO' : 'NO-GO'}
      </div>
    </div>
  );
}
