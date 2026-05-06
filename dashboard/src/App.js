import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AutoMod from './pages/AutoMod';
import Logging from './pages/Logging';
import Welcome from './pages/Welcome';
import ReactionRoles from './pages/ReactionRoles';
import CustomCommands from './pages/CustomCommands';
import Tickets from './pages/Tickets';
import Settings from './pages/Settings';
import ServerSelect from './pages/ServerSelect';
import Leveling from './pages/Leveling';
import Giveaway from './pages/Giveaway';
import Economy from './pages/Economy';
import SendMessage from './pages/SendMessage';
import Modules from './pages/Modules';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://xyrox-production.up.railway.app';
const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';


// ─── Landing Navbar ───────────────────────────────────────────────────────────
function LandingNav({ onLogin }) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: '64px', background: 'rgba(15, 10, 30, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>X</div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Xyrox</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.4)', color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>+ Add Bot</a>
        <button onClick={onLogin} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '8px', background: '#5865F2', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          Login with Discord
        </button>
      </div>
    </nav>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onLogin }) {
  const features = [
    { icon: '🛡️', title: 'Auto Moderation', desc: 'Spam, caps, links, bad words' },
    { icon: '🎫', title: 'Ticket System', desc: 'Support panels with categories' },
    { icon: '⭐', title: 'Leveling', desc: 'Text, voice & reaction XP' },
    { icon: '🎭', title: 'Reaction Roles', desc: 'Buttons, reactions, dropdowns' },
    { icon: '🎉', title: 'Giveaways', desc: 'Timed giveaways with rerolls' },
    { icon: '🪙', title: 'Economy', desc: 'Fish, daily, bank system' },
    { icon: '📋', title: 'Logging', desc: 'Track all server events' },
    { icon: '🤖', title: 'Custom Commands', desc: 'Your own prefix commands' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0f0a1e 100%)', color: '#fff' }}>
      <LandingNav onLogin={onLogin} />
      <div style={{ position: 'fixed', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '0 1rem', paddingTop: '64px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
          Manage your server<br />
          <span style={{ background: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with Xyrox</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          The all-in-one Discord bot with moderation, leveling, tickets, economy, giveaways and more — all configurable from one dashboard.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <button onClick={onLogin} style={{ padding: '14px 32px', borderRadius: 12, background: '#5865F2', border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 24px rgba(88,101,242,0.4)' }}>Login with Discord</button>
          <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>+ Add to Server</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16, maxWidth: 900, width: '100%' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 18px', textAlign: 'left' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{f.icon}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Deep merge helper (for optimistic config updates) ────────────────────────
function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(() => {
    try { const s = localStorage.getItem('xyrox_guild'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [guildConfig, setGuildConfig] = useState(() => {
    try { const s = localStorage.getItem('xyrox_config'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  // Optimistic config ref — always current, used by debounced saver
  const pendingConfigRef = useRef(null);

  const selectedGuildRef = useRef(null);
  useEffect(() => { selectedGuildRef.current = selectedGuild; }, [selectedGuild]);

  useEffect(() => {
    // Connect socket once — use ref so we never need to reconnect
    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.on('config-updated', ({ guildId, config }) => {
      if (selectedGuildRef.current?.id === guildId) setGuildConfig(config);
    });
    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore from localStorage instantly (no loading flicker if already logged in)
  useEffect(() => {
    try {
      const savedUser   = localStorage.getItem('xyrox_user');
      const savedGuilds = localStorage.getItem('xyrox_guilds');
      const savedExpiry = localStorage.getItem('xyrox_expires');
      const savedGuild  = localStorage.getItem('xyrox_guild');
      const savedConfig = localStorage.getItem('xyrox_config');
      if (savedUser && savedExpiry && Date.now() < parseInt(savedExpiry)) {
        setUser(JSON.parse(savedUser));
        setGuilds(JSON.parse(savedGuilds || '[]'));
        if (savedGuild) setSelectedGuild(JSON.parse(savedGuild));
        if (savedConfig) setGuildConfig(JSON.parse(savedConfig));
        setLoading(false);
        // Still verify in background — update guilds silently if session alive
        silentRefresh(savedGuild ? JSON.parse(savedGuild) : null);
        return;
      }
    } catch {}
    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAuth = (user, guilds) => {
    setUser(user);
    setGuilds(guilds);
    const SEVEN_DAYS = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('xyrox_user',   JSON.stringify(user));
    localStorage.setItem('xyrox_guilds', JSON.stringify(guilds));
    localStorage.setItem('xyrox_expires', String(SEVEN_DAYS));
  };

  const clearAuth = () => {
    setUser(null); setGuilds([]); setSelectedGuild(null); setGuildConfig(null);
    localStorage.removeItem('xyrox_user');
    localStorage.removeItem('xyrox_guilds');
    localStorage.removeItem('xyrox_expires');
    localStorage.removeItem('xyrox_guild');
    localStorage.removeItem('xyrox_config');
  };

  // Silent background refresh — updates guilds without showing loading screen
  const silentRefresh = async (restoredGuild) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/user?_t=${Date.now()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guilds && data.guilds.length > 0) {
          saveAuth(data.user, data.guilds);
        }
      }
    } catch {}
    // Re-fetch config for the restored guild in background
    if (restoredGuild) {
      try {
        const res = await fetch(`${API_URL}/api/guilds/${restoredGuild.id}/config`, { credentials: 'include' });
        if (res.ok) {
          const cfg = await res.json();
          setGuildConfig(cfg);
          localStorage.setItem('xyrox_config', JSON.stringify(cfg));
        }
      } catch {}
    }
  };

  const fetchUser = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      // Fresh OAuth redirect
      if (token) {
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          const exchRes = await fetch(`${API_URL}/api/auth/exchange?token=${token}`, {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (exchRes.ok) {
            const data = await exchRes.json();
            console.log('✅ Exchange success — guilds:', data.guilds?.length, data.guilds?.map(g => g.name));
            saveAuth(data.user, data.guilds || []);
            return;
          }
          console.warn('❌ Exchange failed:', exchRes.status);
        } catch (err) {
          console.warn('❌ Exchange error:', err);
        }
      }

      // Session check
      try {
        const res = await fetch(`${API_URL}/api/auth/user?_t=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Session valid — guilds:', data.guilds?.length);
          saveAuth(data.user, data.guilds || []);
          return;
        }
      } catch {}

      // localStorage fallback (within 7-day window)
      try {
        const savedUser   = localStorage.getItem('xyrox_user');
        const savedGuilds = localStorage.getItem('xyrox_guilds');
        const savedExpiry = localStorage.getItem('xyrox_expires');
        if (savedUser && savedExpiry && Date.now() < parseInt(savedExpiry)) {
          console.log('✅ Restored from localStorage');
          setUser(JSON.parse(savedUser));
          setGuilds(JSON.parse(savedGuilds || '[]'));
          return;
        }
      } catch {}

      clearAuth();
    } catch (err) {
      console.error('fetchUser error:', err);
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => { window.location.href = `${API_URL}/api/auth/discord`; };
  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearAuth();
  };

  const handleGuildSelect = async (guild) => {
    setSelectedGuild(guild);
    localStorage.setItem('xyrox_guild', JSON.stringify(guild));
    try {
      const res = await fetch(`${API_URL}/api/guilds/${guild.id}/config`, { credentials: 'include' });
      if (res.ok) {
        const cfg = await res.json();
        setGuildConfig(cfg);
        localStorage.setItem('xyrox_config', JSON.stringify(cfg));
      }
    } catch {}
  };

  // Immediately apply updates to local state (no lag), then debounce the API call
  const _sendUpdate = useCallback(async (guildId, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/guilds/${guildId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const newConfig = await res.json();
        setGuildConfig(newConfig);
        localStorage.setItem('xyrox_config', JSON.stringify(newConfig));
        socketRef.current?.emit('update-config', { guildId, config: newConfig });
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSend = useDebounce(_sendUpdate, 600);

  const updateConfig = useCallback((updates) => {
    if (!selectedGuildRef.current) return;
    // Optimistically merge into local state immediately (no typing lag)
    setGuildConfig(prev => {
      const merged = deepMerge(prev || {}, updates);
      localStorage.setItem('xyrox_config', JSON.stringify(merged));
      pendingConfigRef.current = merged;
      return merged;
    });
    debouncedSend(selectedGuildRef.current.id, updates);
  }, [debouncedSend]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>X</div>
        <div style={{ color: '#a78bfa', fontSize: '1rem', fontWeight: 600 }}>Loading Xyrox…</div>
        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
      </div>
    );
  }

  if (!user) return <LandingPage onLogin={handleLogin} />;
  if (!selectedGuild) return <ServerSelect user={user} guilds={guilds} onSelect={handleGuildSelect} onLogout={handleLogout} />;

  const sharedProps = { guild: selectedGuild, config: guildConfig, updateConfig };

  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>
          <Sidebar guilds={guilds} selectedGuild={selectedGuild} onGuildSelect={handleGuildSelect} />
          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
            <Routes>
              <Route path="/" element={<Dashboard {...sharedProps} user={user} />} />
              <Route path="/modules" element={<Modules {...sharedProps} />} />
              <Route path="/automod" element={<AutoMod {...sharedProps} />} />
              <Route path="/logging" element={<Logging {...sharedProps} />} />
              <Route path="/welcome" element={<Welcome {...sharedProps} />} />
              <Route path="/reaction-roles" element={<ReactionRoles {...sharedProps} />} />
              <Route path="/custom-commands" element={<CustomCommands {...sharedProps} />} />
              <Route path="/tickets" element={<Tickets {...sharedProps} />} />
              <Route path="/leveling" element={<Leveling {...sharedProps} />} />
              <Route path="/giveaways" element={<Giveaway {...sharedProps} />} />
              <Route path="/economy" element={<Economy {...sharedProps} />} />
              <Route path="/send-message" element={<SendMessage guild={selectedGuild} />} />
              <Route path="/settings" element={<Settings {...sharedProps} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
