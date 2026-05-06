import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Dashboard', color: '#7c3aed' },
  { path: '/modules', icon: '🧩', label: 'Modules', color: '#6366f1' },
  { path: '/automod', icon: '🛡️', label: 'Auto Mod', color: '#ef4444' },
  { path: '/logging', icon: '📋', label: 'Logging', color: '#3b82f6' },
  { path: '/welcome', icon: '👋', label: 'Welcome', color: '#22c55e' },
  { path: '/tickets', icon: '🎫', label: 'Tickets', color: '#ec4899' },
  { path: '/reaction-roles', icon: '🎭', label: 'Reaction Roles', color: '#eab308' },
  { path: '/leveling', icon: '⭐', label: 'Leveling', color: '#a78bfa' },
  { path: '/giveaways', icon: '🎉', label: 'Giveaways', color: '#fb923c' },
  { path: '/economy', icon: '🪙', label: 'Economy', color: '#fbbf24' },
  { path: '/custom-commands', icon: '🤖', label: 'Commands', color: '#6366f1' },
  { path: '/send-message', icon: '📣', label: 'Send Message', color: '#22d3ee' },
  { path: '/settings', icon: '⚙️', label: 'Settings', color: '#94a3b8' },
];

export default function Sidebar({ guilds, selectedGuild, onGuildSelect }) {
  const location = useLocation();
  const [guildMenuOpen, setGuildMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      width: collapsed ? 68 : 240,
      background: 'rgba(10,10,25,0.95)',
      backdropFilter: 'blur(12px)',
      minHeight: '100vh',
      borderRight: '1px solid rgba(124,58,237,0.15)',
      transition: 'width 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)} style={{
        position: 'absolute', right: -12, top: 72, zIndex: 10,
        width: 24, height: 24, borderRadius: '50%',
        background: '#1e1b2e', border: '1px solid rgba(124,58,237,0.4)',
        color: '#a78bfa', fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {collapsed ? '›' : '‹'}
      </button>

      {/* Guild Selector */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setGuildMenuOpen(o => !o)} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 10, padding: '10px 12px', borderRadius: 10,
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
          cursor: 'pointer', overflow: 'hidden'
        }}>
          {selectedGuild?.icon
            ? <img src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=64`} alt="" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
            : <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{selectedGuild?.name?.[0] || 'S'}</div>
          }
          {!collapsed && (
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedGuild?.name || 'Select Server'}
            </span>
          )}
          {!collapsed && <span style={{ color: '#64748b', fontSize: 10 }}>{guildMenuOpen ? '▲' : '▼'}</span>}
        </button>

        {guildMenuOpen && !collapsed && (
          <div style={{ position: 'absolute', left: 12, right: 12, top: 70, background: '#1e1b2e', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {guilds.map(g => (
              <button key={g.id} onClick={() => { onGuildSelect(g); setGuildMenuOpen(false); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {g.icon
                  ? <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`} alt="" style={{ width: 26, height: 26, borderRadius: 6 }} />
                  : <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{g.name[0]}</div>
                }
                <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} title={collapsed ? item.label : ''} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px' : '10px 12px',
              borderRadius: 8, marginBottom: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: isActive ? `rgba(${hexToRgb(item.color)}, 0.15)` : 'transparent',
              border: `1px solid ${isActive ? `rgba(${hexToRgb(item.color)}, 0.4)` : 'transparent'}`,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ color: isActive ? '#e2e8f0' : '#94a3b8', fontWeight: isActive ? 600 : 500, fontSize: '0.87rem' }}>{item.label}</span>}
              {isActive && !collapsed && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: item.color }} />}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#334155', fontSize: '0.72rem', textAlign: 'center', margin: 0 }}>Xyrox Dashboard</p>
        </div>
      )}
    </aside>
  );
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '124,58,237';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}
