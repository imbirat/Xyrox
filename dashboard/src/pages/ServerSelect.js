import React, { useState } from 'react';

const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';

function getGuildIcon(guild) {
  if (guild.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  }
  return null;
}

function GuildInitials({ name }) {
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      fontSize: '1.6rem', fontWeight: 800, color: '#fff',
      borderRadius: '50%',
    }}>
      {initials}
    </div>
  );
}

function ServerCard({ guild, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const iconUrl = getGuildIcon(guild);

  return (
    <div
      onClick={() => onSelect(guild)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        padding: '24px 20px',
        borderRadius: '16px',
        background: hovered ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        minWidth: '120px',
        maxWidth: '140px',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        padding: '3px',
        background: hovered
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : 'linear-gradient(135deg, rgba(34,197,94,0.8), rgba(22,163,74,0.8))',
        boxShadow: hovered ? '0 0 16px rgba(34,197,94,0.5)' : '0 0 8px rgba(34,197,94,0.25)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#1e1b2e' }}>
          {iconUrl
            ? <img src={iconUrl} alt={guild.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <GuildInitials name={guild.name} />
          }
        </div>
      </div>

      {/* Name */}
      <span style={{
        color: hovered ? '#e2d9f3' : '#94a3b8',
        fontSize: '0.82rem',
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.3,
        maxWidth: '110px',
        wordBreak: 'break-word',
        transition: 'color 0.2s',
      }}>
        {guild.name}
      </span>
    </div>
  );
}

export default function ServerSelect({ user, guilds, onSelect }) {
  const username = user?.username || user?.global_name || 'there';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0f0a1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      {/* Background glow orbs */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          {/* Xyrox logo badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
            color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>X</div>
            Xyrox Dashboard
          </div>

          <h1 style={{
            color: '#f1f5f9',
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Hello, <span style={{ background: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span>!{' '}
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Please select a server to get started</span>
          </h1>
        </div>

        {/* Server Grid */}
        {guilds.length > 0 ? (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {guilds.map(guild => (
              <ServerCard key={guild.id} guild={guild} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Loading your servers…<br />
              <span style={{ fontSize: '0.85rem', color: '#6d6d8a' }}>If this takes too long, try refreshing the page.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                🔄 Refresh
              </button>
              <a
                href={ADD_BOT_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: '10px',
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; }}
              >
                + Add Xyrox to a Server
              </a>
            </div>
          </div>
        )}

        {/* Add to more servers link */}
        {guilds.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a
              href={ADD_BOT_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: '#6d6d8a', fontSize: '0.85rem',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6d6d8a'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Add Xyrox to another server
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
