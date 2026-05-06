import React, { useState } from 'react';

export default function Settings({ guild, config, updateConfig }) {
  const [saved, setSaved] = useState(false);
  const cfg = config || {};

  const update = (key, val) => updateConfig({ [key]: val });
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const currentPrefix = cfg.prefix || '/';

  const PREFIX_OPTIONS = [
    {
      val: '/',
      icon: '/',
      label: 'Slash',
      sub: 'Discord-style',
      example: '/help',
      note: null,
    },
    {
      val: '?',
      icon: '?',
      label: 'Question',
      sub: 'Common choice',
      example: '?help',
      note: null,
    },
    {
      val: '!',
      icon: '!',
      label: 'Exclaim',
      sub: 'Classic prefix',
      example: '!help',
      note: null,
    },
    {
      val: 'all',
      icon: '⚡',
      label: 'All',
      sub: '!, / and ?',
      example: null,
      note: 'Bot responds to ! / and ? — members can use any of the three.',
    },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>⚙️ Settings</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Server configuration</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>

        {/* Command Mode */}
        <Card title="🔤 Command Mode">
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 12 }}>
            Choose how members interact with the bot.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['slash', '/ Slash Only'], ['prefix', '⌨️ Prefix Only'], ['both', '⚡ Both']].map(([val, lbl]) => (
              <button key={val} onClick={() => update('commandMode', val)} style={{
                padding: '12px', borderRadius: 10,
                border: `2px solid ${cfg.commandMode === val ? '#7c3aed' : '#334155'}`,
                background: cfg.commandMode === val ? 'rgba(124,58,237,0.15)' : '#0f172a',
                color: cfg.commandMode === val ? '#a78bfa' : '#64748b',
                fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s'
              }}>{lbl}</button>
            ))}
          </div>
        </Card>

        {/* Prefix Picker */}
        <Card title="⌨️ Prefix">
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>
            The character members type before a command. Applies when mode is <em style={{ color: '#94a3b8' }}>Prefix Only</em> or <em style={{ color: '#94a3b8' }}>Both</em>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {PREFIX_OPTIONS.map(({ val, icon, label, sub }) => {
              const active = currentPrefix === val;
              return (
                <button key={val} onClick={() => update('prefix', val)} style={{
                  padding: '18px 8px 14px',
                  borderRadius: 12,
                  border: `2px solid ${active ? '#7c3aed' : '#1e293b'}`,
                  background: active ? 'rgba(124,58,237,0.16)' : 'rgba(15,23,42,0.8)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 0 0 1px rgba(124,58,237,0.3)' : 'none',
                }}>
                  {/* big prefix character */}
                  <span style={{
                    fontSize: val === 'all' ? '1.5rem' : '2rem',
                    fontWeight: 900,
                    color: active ? '#a78bfa' : '#475569',
                    lineHeight: 1,
                    fontFamily: 'monospace',
                    transition: 'color 0.15s',
                  }}>{icon}</span>

                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#e2e8f0' : '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '0.72rem', color: active ? '#7c3aed' : '#334155', fontWeight: 500 }}>{sub}</span>

                  {active && (
                    <span style={{ marginTop: 4, width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Contextual info box */}
          {currentPrefix === 'all' ? (
            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 6px' }}>⚡ All Prefixes Active</p>
              <p style={{ color: '#64748b', fontSize: '0.83rem', margin: '0 0 10px' }}>
                Members can trigger commands with <strong style={{ color: '#94a3b8' }}>any</strong> of the three prefixes:
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['!help', '/help', '?help'].map(ex => (
                  <code key={ex} style={{ background: '#1e293b', color: '#a78bfa', padding: '5px 12px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.02em' }}>{ex}</code>
                ))}
              </div>
              <p style={{ color: '#475569', fontSize: '0.78rem', margin: '10px 0 0' }}>
                All three resolve to the same commands — e.g. <code style={{ color: '#64748b' }}>!ban</code>, <code style={{ color: '#64748b' }}>/ban</code> and <code style={{ color: '#64748b' }}>?ban</code> all work identically.
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 8px' }}>Example usage:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['help', 'ban @user', 'kick @user reason', 'warn @user'].map(cmd => (
                  <code key={cmd} style={{ background: '#1e293b', color: '#a78bfa', padding: '4px 10px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                    {currentPrefix}{cmd}
                  </code>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Locale */}
        <Card title="🌍 Locale">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Language</label>
              <select value={cfg.settings?.language || 'en'} onChange={e => updateConfig({ settings: { ...cfg.settings, language: e.target.value } })} style={sel}>
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Timezone</label>
              <select value={cfg.settings?.timezone || 'UTC'} onChange={e => updateConfig({ settings: { ...cfg.settings, timezone: e.target.value } })} style={sel}>
                {['UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Server Info */}
        <Card title="🤖 Server Info">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Server ID', guild?.id],
              ['Server Name', guild?.name],
              ['Member Count', guild?.memberCount],
              ['Custom Commands', config?.customCommands?.length || 0],
              ['Reaction Role Panels', config?.reactionRoles?.length || 0],
              ['Ticket Panels', config?.tickets?.panels?.length || 0],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 3 }}>{k}</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{v ?? '—'}</div>
              </div>
            ))}
          </div>
        </Card>

        <button onClick={save} style={{ padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
          💾 Save Settings
        </button>
        {saved && (
          <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ade80', textAlign: 'center' }}>
            ✅ Settings saved!
          </div>
        )}
      </div>
    </div>
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

const lbl = { color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 6 };
const sel = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', cursor: 'pointer' };
