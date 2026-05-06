import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Tickets({ guild, config, updateConfig }) {
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saved, setSaved] = useState(false);
  const cfg = config?.tickets || {};

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(setChannels).catch(() => {});
    fetch(`${API_URL}/api/guilds/${guild.id}/roles`, { credentials: 'include' })
      .then(r => r.json()).then(setRoles).catch(() => {});
  }, [guild]);

  const update = (path, val) => {
    const parts = path.split('.');
    const obj = { tickets: { ...cfg } };
    let cur = obj.tickets;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] = { ...(cur[parts[i]] || {}) };
    cur[parts[parts.length - 1]] = val;
    updateConfig(obj);
    setSaved(false);
  };


  const textChannels = channels.filter(c => c.type === 0);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🎫 Ticket System</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Support ticket management</p>
        </div>
        <Toggle enabled={cfg.enabled} onChange={v => update('enabled', v)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="📁 Category">
          <Select label="Ticket Category Channel" value={cfg.categoryId || ''} onChange={v => update('categoryId', v)} options={[{ id: '', name: '— None —' }, ...channels.filter(c => c.type === 4)]} />
        </Card>
        <Card title="👥 Support Role">
          <Select label="Support Role" value={cfg.supportRoleId || ''} onChange={v => update('supportRoleId', v)} options={[{ id: '', name: '— None —' }, ...roles]} />
        </Card>
        <Card title="📋 Transcript Channel">
          <Select label="Transcript Log Channel" value={cfg.transcriptChannelId || ''} onChange={v => update('transcriptChannelId', v)} options={[{ id: '', name: '— None —' }, ...textChannels]} />
        </Card>
        <Card title="🎫 Panels">
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Use <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>/ticket setup</code> in Discord to create a ticket panel in any channel.</p>
          {cfg.panels?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>Active Panels:</p>
              {cfg.panels.map((p, i) => (
                <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', marginBottom: 8, color: '#e2e8f0', fontSize: '0.9rem' }}>
                  📌 <strong>{p.title}</strong> — Channel ID: {p.channelId}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {saved && <div style={{ marginTop: 16, padding: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ade80', textAlign: 'center' }}>✅ Saved!</div>}
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)} style={{ position: 'relative', width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: enabled ? '#7c3aed' : '#374151', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 3, left: enabled ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: '20px 24px' }}>
      <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', cursor: 'pointer' }}>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}
