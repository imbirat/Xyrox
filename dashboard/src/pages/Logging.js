import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const logEvents = [
  { key: 'messageDelete', label: '🗑️ Message Delete' },
  { key: 'messageEdit', label: '✏️ Message Edit' },
  { key: 'memberJoin', label: '📥 Member Join' },
  { key: 'memberLeave', label: '📤 Member Leave' },
  { key: 'memberBan', label: '🔨 Member Ban' },
  { key: 'memberKick', label: '👢 Member Kick' },
  { key: 'roleUpdate', label: '🎭 Role Updates' },
  { key: 'channelUpdate', label: '📢 Channel Updates' },
  { key: 'memberUpdate', label: '👤 Member Updates' },
];

export default function Logging({ guild, config, updateConfig }) {
  const [channels, setChannels] = useState([]);
  const cfg = config?.logs || {};

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(d => setChannels(d.filter(c => c.type === 0))).catch(() => {});
  }, [guild]);

  const update = (key, val) => updateConfig({ logs: { ...cfg, [key]: val } });

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📋 Logging System</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Track server events</p>
        </div>
        <Toggle enabled={cfg.enabled} onChange={v => update('enabled', v)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="📢 Log Channel">
          <select value={cfg.channelId || ''} onChange={e => update('channelId', e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem' }}>
            <option value="">— Select channel —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </Card>

        <Card title="📡 Events to Log">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {logEvents.map(ev => (
              <div key={ev.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{ev.label}</span>
                <Toggle enabled={cfg[ev.key] !== false} onChange={v => update(ev.key, v)} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)} style={{ position: 'relative', width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: enabled ? '#7c3aed' : '#374151', transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: enabled ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  );
}
function Card({ title, children }) {
  return <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: '20px 24px' }}><h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>{children}</div>;
}
