import React, { useState } from 'react';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';

export default function ServerSelect({ user, guilds, onSelect, onLogout }) {
  const [search, setSearch] = useState('');
  const username = user?.global_name || user?.username || 'User';
  const avatar = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${(parseInt(user?.discriminator || '0') % 5)}.png`;

  const filtered = (guilds || []).filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #150d28 50%, #0f0a1e 100%)',
      color: '#fff',
    }}>
      {/* ambient glows */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,10,30,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(124,58,237,0.12)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#fff' }}>X</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Xyrox</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={avatar} alt={username} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.4)' }} onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>{username}</span>
          <button
            onClick={onLogout}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Select a Server
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            {!guilds || guilds.length === 0
              ? 'Invite Xyrox to a server to get started'
              : `You manage ${guilds.length} server${guilds.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Search */}
        {guilds && guilds.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none', opacity: 0.4 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your servers…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '12px 16px 12px 40px',
                color: '#e2e8f0', fontSize: '0.95rem', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Server Grid */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            {filtered.map(guild => (
              <ServerCard key={guild.id} guild={guild} onSelect={onSelect} />
            ))}
          </div>
        ) : guilds && guilds.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
            <p style={{ margin: 0 }}>No servers match "<strong style={{ color: '#94a3b8' }}>{search}</strong>"</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🤖</div>
            <h2 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 10px' }}>No servers yet</h2>
            <p style={{ color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              Invite Xyrox to one of your servers, then come back here to manage it.
            </p>
            <a
              href={ADD_BOT_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
              }}
            >
              + Invite Xyrox
            </a>
          </div>
        )}

        {/* Add to another server link */}
        {guilds && guilds.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a
              href={ADD_BOT_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#334155', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#334155'; }}
            >
              + Invite Xyrox to another server
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ServerCard({ guild, onSelect }) {
  const [hov, setHov] = useState(false);
  const hasBot = guild.hasBot !== false;
  const icon = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
    : null;
  const initials = guild.name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={() => hasBot && onSelect(guild)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '22px 14px 18px',
        borderRadius: 16, cursor: hasBot ? 'pointer' : 'default',
        background: hov && hasBot ? 'rgba(124,58,237,0.13)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov && hasBot ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
        transform: hov && hasBot ? 'translateY(-4px)' : 'none',
        transition: 'all 0.18s ease',
        userSelect: 'none',
        opacity: hasBot ? 1 : 0.55,
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hov && hasBot ? '0 0 20px rgba(124,58,237,0.45)' : '0 2px 10px rgba(0,0,0,0.35)',
        transition: 'box-shadow 0.18s',
      }}>
        {icon
          ? <img src={icon} alt={guild.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          : <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{initials}</span>
        }
      </div>

      <span style={{
        color: hov && hasBot ? '#e2e8f0' : '#94a3b8',
        fontSize: '0.82rem', fontWeight: 600,
        textAlign: 'center', lineHeight: 1.4, maxWidth: 130,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        transition: 'color 0.15s',
      }}>
        {guild.name}
      </span>

      {hasBot ? (
        <span style={{ fontSize: '0.7rem', color: hov ? '#7c3aed' : 'transparent', transition: 'color 0.15s' }}>▶ Manage</span>
      ) : (
        <a
          href={`https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot&guild_id=${guild.id}`}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa',
            background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 6, padding: '3px 10px', textDecoration: 'none',
          }}
        >
          + Add Bot
        </a>
      )}
    </div>
  );
}
