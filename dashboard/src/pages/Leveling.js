import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Leveling({ guild, config, updateConfig }) {
  const [channels, setChannels] = useState([]);
  const cfg = config?.leveling || {};

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(d => setChannels(d.filter(c => c.type === 0))).catch(() => {});
  }, [guild]);

  const update = (key, val) => updateConfig({ leveling: { ...cfg, [key]: val } });
  const textChannels = [{ id: '', name: '— Same channel as message —' }, ...channels];

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>⭐ Leveling System</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>XP and level tracking</p>
        </div>
        <Toggle enabled={cfg.enabled} onChange={v => update('enabled', v)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="📊 XP Sources">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <XPToggle label="💬 Text Messages" enabled={cfg.textXP !== false} onChange={v => update('textXP', v)} />
            <XPToggle label="🔊 Voice Activity" enabled={cfg.voiceXP} onChange={v => update('voiceXP', v)} />
            <XPToggle label="🎭 Reactions" enabled={cfg.reactionXP} onChange={v => update('reactionXP', v)} />
          </div>
        </Card>

        <Card title="⚙️ XP Settings">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <NumberInput label="Min XP per Message" value={cfg.xpPerMessageMin ?? 15} min={1} max={100} onChange={v => update('xpPerMessageMin', v)} />
            <NumberInput label="Max XP per Message" value={cfg.xpPerMessageMax ?? 25} min={1} max={200} onChange={v => update('xpPerMessageMax', v)} />
            <NumberInput label="XP per Minute (Voice)" value={cfg.xpPerMinuteVoice ?? 10} min={1} max={100} onChange={v => update('xpPerMinuteVoice', v)} />
            <NumberInput label="XP per Reaction" value={cfg.xpPerReaction ?? 5} min={1} max={50} onChange={v => update('xpPerReaction', v)} />
            <NumberInput label="Cooldown (seconds)" value={cfg.xpCooldown ?? 60} min={5} max={300} onChange={v => update('xpCooldown', v)} />
          </div>
        </Card>

        <Card title="🎉 Level Up Notification">
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Level Up Message</label>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 6 }}>Variables: <code style={{ background: '#1e293b', padding: '1px 5px', borderRadius: 3, color: '#a78bfa' }}>{'{user}'}</code> <code style={{ background: '#1e293b', padding: '1px 5px', borderRadius: 3, color: '#a78bfa' }}>{'{level}'}</code> <code style={{ background: '#1e293b', padding: '1px 5px', borderRadius: 3, color: '#a78bfa' }}>{'{xp}'}</code></p>
            <textarea value={cfg.levelUpMessage || '🎉 Congratulations {user}! You leveled up to level **{level}**!'} onChange={e => update('levelUpMessage', e.target.value)} rows={2} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Level Up Channel (optional)</label>
            <select value={cfg.levelUpChannelId || ''} onChange={e => update('levelUpChannelId', e.target.value || null)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem' }}>
              {textChannels.map(c => <option key={c.id} value={c.id}>{c.id ? `#${c.name}` : c.name}</option>)}
            </select>
          </div>
        </Card>

        <Card title="📋 Commands">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['👤 /profile [user]', 'View your or another user\'s level'],
              ['🏆 /leaderboard levels', 'Server level leaderboard'],
              ['➕ /xp add @user 100', 'Admin: Give XP'],
              ['➖ /xp remove @user 50', 'Admin: Remove XP'],
              ['🔧 /xp set @user 500', 'Admin: Set XP'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px' }}>
                <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{cmd}</code>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>{desc}</p>
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
function XPToggle({ label, enabled, onChange }) {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{label}</span>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}
function NumberInput({ label, value, min, max, onChange }) {
  return (
    <div>
      <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type="number" value={value} min={min} max={max} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
    </div>
  );
}
