import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BLANK = { name: '', response: '', embed: { enabled: false, title: '', description: '', color: '#5865F2', footer: '' }, deleteCommand: false };

export default function CustomCommands({ guild, config, updateConfig }) {
  const commands = config?.customCommands || [];
  const prefix = config?.prefix || '!';
  const [form, setForm] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEmbed = (k, v) => setForm(f => ({ ...f, embed: { ...f.embed, [k]: v } }));

  const add = async () => {
    if (!form.name || !form.response) return setMsg('❌ Name and response are required.');
    if (!/^[a-z0-9_-]+$/i.test(form.name)) return setMsg('❌ Command name can only contain letters, numbers, dashes and underscores.');
    if (commands.find(c => c.name.toLowerCase() === form.name.toLowerCase())) return setMsg('❌ A command with this name already exists.');
    try {
      const res = await fetch(`${API_URL}/api/guilds/${guild.id}/custom-commands`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.toLowerCase(), response: form.response, embed: form.embed, deleteCommand: form.deleteCommand })
      });
      if (res.ok) {
        const data = await res.json();
        updateConfig({ customCommands: data });
        setForm(BLANK); setAdding(false); setMsg('');
      } else setMsg('❌ Failed to add command.');
    } catch { setMsg('❌ Network error.'); }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/guilds/${guild.id}/custom-commands/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { const data = await res.json(); updateConfig({ customCommands: data }); }
    } catch {}
  };

  const vars = ['{user}', '{user.name}', '{server}', '{server.members}', '{channel}', '{channel.name}'];

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🤖 Custom Commands</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>{commands.length} commands · Prefix: <code style={{ color: '#a78bfa', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>{prefix}</code></p>
        </div>
        <button onClick={() => { setAdding(a => !a); setMsg(''); }} style={{ padding: '10px 20px', background: adding ? '#374151' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
          {adding ? '✕ Cancel' : '+ Add Command'}
        </button>
      </div>

      {adding && (
        <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 16px' }}>➕ New Command</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={lbl}>Command Name (without prefix)</label>
              <input value={form.name} onChange={e => setF('name', e.target.value.toLowerCase())} placeholder="e.g. rules, socials, website" style={inp} />
              {form.name && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>Usage: {prefix}{form.name}</p>}
            </div>
            <div>
              <label style={lbl}>Response</label>
              <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 6 }}>Variables: {vars.map(v => <code key={v} style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3, color: '#a78bfa', marginRight: 4 }}>{v}</code>)}</p>
              <textarea value={form.response} onChange={e => setF('response', e.target.value)} placeholder="What the bot should respond with..." rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.deleteCommand} onChange={e => setF('deleteCommand', e.target.checked)} style={{ accentColor: '#7c3aed' }} />
                Delete user's message
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.embed.enabled} onChange={e => setEmbed('enabled', e.target.checked)} style={{ accentColor: '#7c3aed' }} />
                Use Embed
              </label>
            </div>
            {form.embed.enabled && (
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 16, display: 'grid', gap: 12 }}>
                <input value={form.embed.title} onChange={e => setEmbed('title', e.target.value)} placeholder="Embed title" style={inp} />
                <textarea value={form.embed.description} onChange={e => setEmbed('description', e.target.value)} placeholder="Embed description" rows={2} style={{ ...inp, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={form.embed.color} onChange={e => setEmbed('color', e.target.value)} style={{ width: 38, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                    <input value={form.embed.color} onChange={e => setEmbed('color', e.target.value)} style={{ ...inp, width: 100 }} />
                  </div>
                  <input value={form.embed.footer} onChange={e => setEmbed('footer', e.target.value)} placeholder="Footer text" style={inp} />
                </div>
              </div>
            )}
            {msg && <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171' }}>{msg}</div>}
            <button onClick={add} style={{ padding: '12px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>✅ Add Command</button>
          </div>
        </div>
      )}

      {commands.length > 0 ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {commands.map((cmd, i) => (
            <div key={cmd._id || i} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <code style={{ background: '#1e293b', color: '#a78bfa', padding: '4px 10px', borderRadius: 6, fontSize: '0.9rem', flexShrink: 0 }}>{prefix}{cmd.name}</code>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.embed?.enabled ? `[Embed] ${cmd.embed.title || ''}` : cmd.response}</span>
              {cmd.deleteCommand && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 7px', borderRadius: 5, fontSize: '0.75rem' }}>deletes</span>}
              {cmd.embed?.enabled && <span style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', padding: '2px 7px', borderRadius: 5, fontSize: '0.75rem' }}>embed</span>}
              <button onClick={() => remove(cmd._id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>Remove</button>
            </div>
          ))}
        </div>
      ) : !adding && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(30,41,59,0.3)', border: '1px dashed rgba(51,65,85,0.4)', borderRadius: 12 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
          <p style={{ color: '#94a3b8' }}>No custom commands yet. Click "+ Add Command" to create one!</p>
        </div>
      )}
    </div>
  );
}

const lbl = { color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 };
const inp = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' };
