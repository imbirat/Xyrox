import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Giveaway({ guild, config, updateConfig }) {
  const [giveaways, setGiveaways] = useState([]);
  const [channels, setChannels] = useState([]);
  const [form, setForm] = useState({ channelId: '', prize: '', duration: '1h', winnerCount: 1 });
  
  const [msg, setMsg] = useState(''); // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/giveaways`, { credentials: 'include' })
      .then(r => r.json()).then(setGiveaways).catch(() => {});
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(d => setChannels(d.filter(c => c.type === 0))).catch(() => {});
  }, [guild]);


  const active = giveaways.filter(g => !g.ended);
  const ended = giveaways.filter(g => g.ended);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🎉 Giveaways</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Create and manage server giveaways</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="🚀 Start a Giveaway">
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: '#a78bfa', fontSize: '0.85rem', margin: 0 }}>
              Use <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>/giveaway start prize:"Prize" duration:1h winners:1</code> in Discord to start a giveaway.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Prize</label>
              <input value={form.prize} onChange={e => setForm(f => ({...f, prize: e.target.value}))} placeholder="e.g. Nitro Classic" style={inp} />
            </div>
            <div>
              <label style={lbl}>Duration</label>
              <select value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} style={inp}>
                {['10m','30m','1h','2h','6h','12h','1d','3d','7d'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Channel</label>
              <select value={form.channelId} onChange={e => setForm(f => ({...f, channelId: e.target.value}))} style={inp}>
                <option value="">— Select channel —</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Winners</label>
              <input type="number" min={1} max={20} value={form.winnerCount} onChange={e => setForm(f => ({...f, winnerCount: +e.target.value}))} style={inp} />
            </div>
          </div>
          {form.prize && form.duration && (
            <div style={{ marginTop: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 4px' }}>Discord command to run:</p>
              <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>/giveaway start prize:"{form.prize}" duration:{form.duration} winners:{form.winnerCount}</code>
            </div>
          )}
          {msg && <div style={{ marginTop: 12, padding: 12, background: msg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</div>}
        </Card>

        <Card title={`🎯 Active Giveaways (${active.length})`}>
          {active.length > 0 ? active.map((g, i) => (
            <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 4px' }}>🎉 {g.prize}</p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    {g.winnerCount} winner(s) · {g.entries?.length || 0} entries · Ends {g.endTime ? new Date(g.endTime).toLocaleString() : 'soon'}
                  </p>
                </div>
                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 8px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE</span>
              </div>
            </div>
          )) : <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No active giveaways</p>}
        </Card>

        <Card title={`📜 Recent Ended (${ended.length})`}>
          {ended.slice(0, 5).length > 0 ? ended.slice(0, 5).map((g, i) => (
            <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontWeight: 600, margin: '0 0 4px' }}>{g.prize}</p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    Winners: {g.winners?.length > 0 ? g.winners.map(w => `<@${w}>`).join(', ') : 'None'} · {g.entries?.length || 0} entries
                  </p>
                </div>
                <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', padding: '3px 8px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600 }}>ENDED</span>
              </div>
            </div>
          )) : <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No ended giveaways</p>}
        </Card>

        <Card title="📋 Commands">
          {[
            ['/giveaway start prize:"Nitro" duration:1h winners:1', 'Start a giveaway'],
            ['/giveaway end <message_id>', 'End a giveaway early'],
            ['/giveaway reroll <message_id>', 'Pick new winner(s)'],
          ].map(([cmd, desc]) => (
            <div key={cmd} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{cmd}</code>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>{desc}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

const lbl = { color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 };
const inp = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' };
function Card({ title, children }) {
  return <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: '20px 24px' }}><h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>{children}</div>;
}
