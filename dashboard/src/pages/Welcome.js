import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Welcome({ guild, config, updateConfig }) {
  const [channels, setChannels] = useState([]);
  const cfg = config?.welcome || {};

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(d => setChannels(d.filter(c => c.type === 0))).catch(() => {});
  }, [guild]);

  const update = (path, val) => {
    const keys = path.split('.');
    const root = { welcome: JSON.parse(JSON.stringify(cfg)) };
    let cur = root.welcome;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] = cur[keys[i]] || {};
    cur[keys[keys.length - 1]] = val;
    updateConfig(root);
  };

  const vars = ['{user}', '{user.name}', '{server}', '{server.members}', '{channel}'];

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>👋 Welcome System</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Greet new members</p>
        </div>
        <Toggle enabled={cfg.enabled} onChange={v => update('enabled', v)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="📢 Welcome Channel">
          <Select label="Channel" value={cfg.channelId || ''} onChange={v => update('channelId', v)} options={[{ id: '', name: '— Select channel —' }, ...channels]} />
        </Card>

        <Card title="💬 Welcome Message">
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>Variables: {vars.map(v => <code key={v} style={{ background: '#1e293b', padding: '1px 5px', borderRadius: 3, marginRight: 4, color: '#a78bfa' }}>{v}</code>)}</p>
          <textarea value={cfg.message || ''} onChange={e => update('message', e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
        </Card>

        <Card title="🎨 Embed Message">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ color: '#94a3b8' }}>Use Embed</span>
            <Toggle enabled={cfg.embed?.enabled} onChange={v => update('embed.enabled', v)} />
          </div>
          {cfg.embed?.enabled && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Input label="Embed Title" value={cfg.embed?.title || ''} onChange={v => update('embed.title', v)} />
              <Textarea label="Embed Description" value={cfg.embed?.description || ''} onChange={v => update('embed.description', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ColorInput label="Color" value={cfg.embed?.color || '#5865F2'} onChange={v => update('embed.color', v)} />
                <Input label="Footer Text" value={cfg.embed?.footer || ''} onChange={v => update('embed.footer', v)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Show user thumbnail</span>
                <Toggle enabled={cfg.embed?.thumbnail !== false} onChange={v => update('embed.thumbnail', v)} />
              </div>
            </div>
          )}
        </Card>

        <Card title="📩 DM Message">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#94a3b8' }}>Send DM on join</span>
            <Toggle enabled={cfg.dmMessage?.enabled} onChange={v => update('dmMessage.enabled', v)} />
          </div>
          {cfg.dmMessage?.enabled && (
            <Textarea label="DM Content" value={cfg.dmMessage?.content || ''} onChange={v => update('dmMessage.content', v)} />
          )}
        </Card>

        {/* Preview */}
        <Card title="👁️ Preview">
          <div style={{ background: '#0f172a', border: `4px solid ${cfg.embed?.color || '#5865F2'}`, borderRadius: 8, borderLeft: `4px solid ${cfg.embed?.color || '#5865F2'}`, padding: 16, display: 'flex', gap: 12 }}>
            {cfg.embed?.thumbnail !== false && <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', flexShrink: 0 }} />}
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{cfg.embed?.title || 'Welcome!'}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>
                {(cfg.embed?.description || cfg.message || 'Welcome {user} to {server}!').replace('{user}', '@NewMember').replace('{server}', guild?.name || 'Server').replace('{user.name}', 'NewMember').replace('{server.members}', '100')}
              </div>
              {cfg.embed?.footer && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 8 }}>{cfg.embed.footer}</div>}
            </div>
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
function Input({ label, value, onChange, placeholder }) {
  return <div><label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{label}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' }} /></div>;
}
function Textarea({ label, value, onChange }) {
  return <div><label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} /></div>;
}
function ColorInput({ label, value, onChange }) {
  return <div><label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{label}</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={value || '#5865F2'} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} /><input value={value || '#5865F2'} onChange={e => onChange(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem' }} /></div></div>;
}
function Select({ label, value, onChange, options }) {
  return <div style={{ marginBottom: 12 }}>{label && <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>{label}</label>}<select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', cursor: 'pointer' }}>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>;
}
