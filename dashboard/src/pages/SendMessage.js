import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function SendMessage({ guild }) {
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [useEmbed, setUseEmbed] = useState(false);
  const [embed, setEmbed] = useState({ title: '', description: '', color: '#5865F2', footer: '', image: '' });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!guild) return;
    fetch(`${API_URL}/api/guilds/${guild.id}/channels`, { credentials: 'include' })
      .then(r => r.json()).then(d => setChannels(d.filter(c => c.type === 0))).catch(() => {});
  }, [guild]);

  const updateEmbed = (k, v) => setEmbed(e => ({ ...e, [k]: v }));

  const send = async () => {
    if (!channelId) return setStatus({ ok: false, msg: '❌ Please select a channel.' });
    if (!content && !useEmbed) return setStatus({ ok: false, msg: '❌ Add a message or enable embed.' });
    if (useEmbed && !embed.title && !embed.description) return setStatus({ ok: false, msg: '❌ Embed needs a title or description.' });
    setSending(true); setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/guilds/${guild.id}/send-message`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, content, embed: useEmbed ? { ...embed, enabled: true } : null })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: '✅ Message sent successfully!' });
        setContent(''); setEmbed({ title: '', description: '', color: '#5865F2', footer: '', image: '' }); setUseEmbed(false);
      } else {
        setStatus({ ok: false, msg: `❌ ${data.error || 'Failed to send.'}` });
      }
    } catch { setStatus({ ok: false, msg: '❌ Network error.' }); }
    setSending(false);
  };

  const previewColor = embed.color || '#5865F2';

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📣 Send Message</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Send announcements or embeds to any channel</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="📢 Target Channel">
          <select value={channelId} onChange={e => setChannelId(e.target.value)} style={sel}>
            <option value="">— Select channel —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </Card>

        <Card title="💬 Message Content">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write a message... (optional if using embed)" rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
        </Card>

        <Card title="🎨 Embed">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: useEmbed ? 16 : 0 }}>
            <span style={{ color: '#94a3b8' }}>Use embed message</span>
            <Toggle enabled={useEmbed} onChange={setUseEmbed} />
          </div>
          {useEmbed && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Input label="Title" value={embed.title} onChange={v => updateEmbed('title', v)} placeholder="Embed title" />
              <div>
                <label style={lbl}>Description</label>
                <textarea value={embed.description} onChange={e => updateEmbed('description', e.target.value)} placeholder="Embed description..." rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={embed.color} onChange={e => updateEmbed('color', e.target.value)} style={{ width: 42, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                    <input value={embed.color} onChange={e => updateEmbed('color', e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem' }} />
                  </div>
                </div>
                <Input label="Footer Text" value={embed.footer} onChange={v => updateEmbed('footer', v)} placeholder="Footer text" />
              </div>
              <Input label="Image URL (optional)" value={embed.image} onChange={v => updateEmbed('image', v)} placeholder="https://..." />
            </div>
          )}
        </Card>

        {/* Live Preview */}
        {(content || useEmbed) && (
          <Card title="👁️ Preview">
            <div style={{ background: '#36393f', borderRadius: 8, padding: 16 }}>
              {content && <p style={{ color: '#dcddde', fontSize: '0.95rem', margin: useEmbed ? '0 0 8px' : 0 }}>{content}</p>}
              {useEmbed && (embed.title || embed.description) && (
                <div style={{ borderLeft: `4px solid ${previewColor}`, background: '#2f3136', borderRadius: '0 4px 4px 0', padding: 14 }}>
                  {embed.title && <div style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>{embed.title}</div>}
                  {embed.description && <div style={{ color: '#b9bbbe', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{embed.description}</div>}
                  {embed.image && <img src={embed.image} alt="embed" style={{ maxWidth: '100%', borderRadius: 4, marginTop: 8 }} onError={e => e.target.style.display='none'} />}
                  {embed.footer && <div style={{ color: '#72767d', fontSize: '0.78rem', marginTop: 8, borderTop: '1px solid #40444b', paddingTop: 8 }}>{embed.footer}</div>}
                </div>
              )}
            </div>
          </Card>
        )}

        <button onClick={send} disabled={sending} style={{ padding: '14px 28px', background: sending ? '#374151' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {sending ? '⏳ Sending...' : '📣 Send Message'}
        </button>

        {status && (
          <div style={{ padding: 14, background: status.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${status.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, color: status.ok ? '#4ade80' : '#f87171', fontWeight: 500 }}>
            {status.msg}
          </div>
        )}
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
  return <div><label style={lbl}>{label}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' }} /></div>;
}
const lbl = { color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 };
const sel = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', cursor: 'pointer' };
