import React, { useState, useEffect } from 'react';

const MODULE_LIST = [
  { key: 'moderation', icon: '🔨', label: 'Moderation', desc: 'Ban, kick, warn, timeout, and other mod tools', color: '#ef4444', alwaysOn: true },
  { key: 'automod', icon: '🛡️', label: 'Auto Moderation', desc: 'Automatic spam, caps, links, and bad word filtering', color: '#f97316' },
  { key: 'logging', icon: '📋', label: 'Logging', desc: 'Track message edits, deletes, member joins/leaves', color: '#3b82f6' },
  { key: 'welcome', icon: '👋', label: 'Welcome System', desc: 'Greet new members with custom messages or embeds', color: '#22c55e' },
  { key: 'tickets', icon: '🎫', label: 'Ticket System', desc: 'Support ticket creation with panels and categories', color: '#ec4899' },
  { key: 'reactionRoles', icon: '🎭', label: 'Reaction Roles', desc: 'Let members self-assign roles via buttons or reactions', color: '#eab308' },
  { key: 'leveling', icon: '⭐', label: 'Leveling', desc: 'XP system with text, voice, and reaction XP tracking', color: '#a78bfa' },
  { key: 'giveaways', icon: '🎉', label: 'Giveaways', desc: 'Create and manage timed giveaways with winner selection', color: '#fb923c' },
  { key: 'economy', icon: '🪙', label: 'Economy', desc: 'Virtual currency, daily rewards, fishing, bank system', color: '#fbbf24' },
  { key: 'customCommands', icon: '🤖', label: 'Custom Commands', desc: 'Create your own prefix commands with custom responses', color: '#6366f1' },
  { key: 'afk', icon: '💤', label: 'AFK System', desc: 'Set AFK status with reason, auto-removed when you return', color: '#94a3b8' },
];

export default function Modules({ config, updateConfig }) {
  // Local state for instant toggle feedback (no waiting for API)
  const [modules, setModules] = useState(() => config?.modules || {});

  // Sync when config changes externally (e.g. after page reload)
  useEffect(() => {
    if (config?.modules) setModules(config.modules);
  }, [config]);

  const isEnabled = (mod) => {
    if (mod.alwaysOn) return true;
    // If not explicitly set, default to false (opt-in)
    return modules[mod.key] === true;
  };

  const toggle = (key) => {
    const mod = MODULE_LIST.find(m => m.key === key);
    if (!mod || mod.alwaysOn) return;
    const newVal = !isEnabled(mod);
    const newModules = { ...modules, [key]: newVal };
    setModules(newModules);          // instant UI update
    updateConfig({ modules: newModules }); // debounced API call
  };

  const enabledCount = MODULE_LIST.filter(m => isEnabled(m)).length;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🧩 Modules</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>{enabledCount} of {MODULE_LIST.length} modules enabled</p>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: '16px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Module Coverage</span>
          <span style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600 }}>{Math.round((enabledCount/MODULE_LIST.length)*100)}%</span>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 999, height: 8 }}>
          <div style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', borderRadius: 999, height: 8, width: `${(enabledCount/MODULE_LIST.length)*100}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {MODULE_LIST.map(mod => {
          const on = isEnabled(mod);
          return (
            <div key={mod.key} onClick={() => toggle(mod.key)} style={{
              background: on ? `rgba(${hexToRgb(mod.color)}, 0.08)` : 'rgba(15,23,42,0.6)',
              border: `1px solid ${on ? `rgba(${hexToRgb(mod.color)}, 0.35)` : 'rgba(51,65,85,0.4)'}`,
              borderRadius: 12, padding: '18px 20px', cursor: mod.alwaysOn ? 'default' : 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 16,
              userSelect: 'none',
            }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{mod.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' }}>{mod.label}</span>
                  {/* Toggle switch */}
                  {mod.alwaysOn ? (
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: `rgba(${hexToRgb(mod.color)}, 0.2)`, color: mod.color }}>CORE</span>
                  ) : (
                    <div style={{
                      position: 'relative', width: 40, height: 22, borderRadius: 999, flexShrink: 0,
                      background: on ? mod.color : '#334155', transition: 'background 0.2s',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }} />
                    </div>
                  )}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{mod.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '124,58,237';
  return `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}`;
}
