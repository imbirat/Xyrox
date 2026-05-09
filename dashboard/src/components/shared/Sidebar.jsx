/**
 * dashboard/src/components/shared/Sidebar.jsx
 *
 * Collapsible sidebar with guild selector.
 * All Kythia feature routes are included.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/',               icon: '🏠', label: 'Dashboard',     color: '#7c3aed' },
    { path: '/modules',        icon: '🧩', label: 'Modules',        color: '#6366f1' },
    { path: '/automod',        icon: '🛡️', label: 'Auto Mod',       color: '#ef4444' },
    { path: '/logging',        icon: '📋', label: 'Logging',         color: '#3b82f6' },
    { path: '/welcome',        icon: '👋', label: 'Welcome',         color: '#22c55e' },
    { path: '/tickets',        icon: '🎫', label: 'Tickets',         color: '#ec4899' },
    { path: '/reaction-roles', icon: '🎭', label: 'Reaction Roles',  color: '#eab308' },
    { path: '/leveling',       icon: '⭐', label: 'Leveling',        color: '#a78bfa' },
    { path: '/giveaways',      icon: '🎉', label: 'Giveaways',       color: '#fb923c' },
    { path: '/economy',        icon: '🪙', label: 'Economy',         color: '#fbbf24' },
    { path: '/send-message',   icon: '📣', label: 'Send Message',    color: '#22d3ee' },
    { path: '/settings',       icon: '⚙️', label: 'Settings',        color: '#94a3b8' },
];

export default function Sidebar({ guilds, selectedGuild, onGuildSelect }) {
    const location = useLocation();
    const [guildMenuOpen, setGuildMenuOpen] = useState(false);
    const [collapsed,     setCollapsed]     = useState(false);

    return (
        <aside style={{
            width:       collapsed ? 68 : 240,
            background:  'rgba(10,10,25,0.97)',
            backdropFilter: 'blur(12px)',
            minHeight:   '100vh',
            borderRight: '1px solid rgba(124,58,237,0.15)',
            transition:  'width 0.25s ease',
            display:     'flex',
            flexDirection: 'column',
            position:    'relative',
            flexShrink:  0,
        }}>
            {/* Collapse toggle */}
            <button onClick={() => setCollapsed((c) => !c)} style={{
                position:    'absolute', right: -12, top: 72, zIndex: 10,
                width: 24,  height: 24, borderRadius: '50%',
                background:  '#1e1b2e', border: '1px solid rgba(124,58,237,0.4)',
                color:       '#a78bfa', fontSize: 12, cursor: 'pointer',
                display:     'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {collapsed ? '›' : '‹'}
            </button>

            {/* Guild selector */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => setGuildMenuOpen((o) => !o)} style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                    cursor: 'pointer', overflow: 'hidden',
                }}>
                    {selectedGuild?.icon
                        ? <img src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=64`} alt="" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {selectedGuild?.name?.[0] || 'S'}
                          </div>
                    }
                    {!collapsed && (
                        <>
                            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedGuild?.name || 'Select Server'}
                            </span>
                            <span style={{ color: '#7c3aed', fontSize: 11 }}>▾</span>
                        </>
                    )}
                </button>

                {/* Guild dropdown */}
                {guildMenuOpen && !collapsed && (
                    <div style={{
                        position:   'absolute', left: 12, right: 12, top: 76, zIndex: 100,
                        background: '#1a1625', border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                        {guilds.filter((g) => g.hasBot).map((g) => (
                            <button key={g.id} onClick={() => { onGuildSelect(g); setGuildMenuOpen(false); }} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', background: selectedGuild?.id === g.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                                border: 'none', cursor: 'pointer',
                            }}>
                                {g.icon
                                    ? <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=32`} alt="" style={{ width: 26, height: 26, borderRadius: 6 }} />
                                    : <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{g.name[0]}</div>
                                }
                                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} style={{
                            display:    'flex', alignItems: 'center', gap: 10,
                            padding:    collapsed ? '10px 18px' : '10px 12px',
                            borderRadius: 8, textDecoration: 'none', marginBottom: 2,
                            background: isActive ? `${item.color}22` : 'transparent',
                            border:     isActive ? `1px solid ${item.color}44` : '1px solid transparent',
                            transition: 'all 0.15s ease',
                        }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && (
                                <span style={{
                                    color:      isActive ? '#fff' : '#94a3b8',
                                    fontSize:   13, fontWeight: isActive ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Kythia branding */}
            {!collapsed && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <a href="https://xyrox.qzz.io" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>K</span>
                        </div>
                        <div>
                            <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>Kythia</div>
                            <div style={{ color: '#64748b', fontSize: 10 }}>v2.0.0</div>
                        </div>
                    </a>
                </div>
            )}
        </aside>
    );
}
