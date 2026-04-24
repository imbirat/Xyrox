import React, { useState, useEffect } from 'react';
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
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://xyrox-production.up.railway.app';
const ADD_BOT_URL = 'https://discord.com/oauth2/authorize?client_id=1496858363688915115&permissions=8&integration_type=0&scope=bot';

// ─── Landing Navbar ───────────────────────────────────────────────────────────
function LandingNav({ onLogin }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '64px',
      background: 'rgba(15, 10, 30, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff'
        }}>X</div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Xyrox
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a
          href={ADD_BOT_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px', borderRadius: '8px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.4)',
            color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = '#a78bfa'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          Add Bot
        </a>

        <button
          onClick={onLogin}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '8px',
            background: '#5865F2',
            border: 'none',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; }}
        >
          {/* Discord icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .083-.026 13.94 13.94 0 0 0 1.226-1.994.076.076 0 0 0-.042-.105 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Login
        </button>
      </div>
    </nav>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0f0a1e 100%)', color: '#fff' }}>
      <LandingNav onLogin={onLogin} />

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '0 1rem', paddingTop: '64px' }}>
        {/* Glow orbs */}
        <div style={{ position: 'fixed', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
            color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem',
            letterSpacing: '0.05em', textTransform: 'uppercase'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            Discord Bot Dashboard
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Manage your server
            <br />
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with Xyrox
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Moderation, AutoMod, logging, welcome messages, reaction roles — all in one powerful dashboard.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onLogin}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 12,
                background: '#5865F2', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 24px rgba(88,101,242,0.4)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(88,101,242,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(88,101,242,0.4)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .083-.026 13.94 13.94 0 0 0 1.226-1.994.076.076 0 0 0-.042-.105 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Login with Discord
            </button>

            <a
              href={ADD_BOT_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.4)',
                color: '#a78bfa', fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Add to Server
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  // Restore user from localStorage on first load (survives page refresh)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('xyrox_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [guilds, setGuilds] = useState(() => {
    try {
      const saved = localStorage.getItem('xyrox_guilds');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildConfig, setGuildConfig] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Socket.io only when logged in
  useEffect(() => {
    if (!user) return;
    const newSocket = io(API_URL, { withCredentials: true });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [user]);

  // Listen for config updates
  useEffect(() => {
    if (!socket || !selectedGuild) return;
    socket.on('config-updated', (data) => {
      if (data.guildId === selectedGuild.id) setGuildConfig(data.config);
    });
    return () => socket.off('config-updated');
  }, [socket, selectedGuild]);

  // On mount: check for ?token= (from OAuth redirect) or just fetch existing session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    // Clean URL immediately so token isn't visible or reused
    if (token || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      console.error('OAuth error:', error);
      setLoading(false);
      return;
    }

    if (token) {
      // Exchange one-time token for session
      exchangeToken(token);
    } else {
      // Normal page load — check existing session
      fetchUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Exchange the one-time token from URL for user data + session
  const exchangeToken = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/exchange?token=${token}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('xyrox_user', JSON.stringify(data.user));
        localStorage.setItem('xyrox_guilds', JSON.stringify(data.guilds || []));
        setUser(data.user);
        setGuilds(data.guilds || []);
        
        // CRITICAL FIX: Remove token from URL to prevent re-exchange on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('Token exchange failed — asking user to login again');
        localStorage.removeItem('xyrox_user');
        localStorage.removeItem('xyrox_guilds');
        setUser(null);
        setGuilds([]);
        
        // Remove failed token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      setUser(null);
      
      // Remove token from URL even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoading(false);
    }
  };

  // Check existing session (used on normal page loads / refreshes)
  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/user?_=${Date.now()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('xyrox_user', JSON.stringify(data.user));
        localStorage.setItem('xyrox_guilds', JSON.stringify(data.guilds || []));
        setUser(data.user);
        setGuilds(data.guilds || []);
      } else {
        localStorage.removeItem('xyrox_user');
        localStorage.removeItem('xyrox_guilds');
        setUser(null);
        setGuilds([]);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't clear localStorage on network error — user may just be offline
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    localStorage.removeItem('xyrox_user');
    localStorage.removeItem('xyrox_guilds');
    try {
      setUser(null);
      setGuilds([]);
      setSelectedGuild(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleGuildSelect = async (guild) => {
    setSelectedGuild(guild);
    try {
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/config`, { credentials: 'include' });
      if (response.ok) {
        const config = await response.json();
        setGuildConfig(config);
      }
    } catch (error) {
      console.error('Error fetching guild config:', error);
    }
  };

  const updateConfig = async (updates) => {
    if (!selectedGuild) return;
    try {
      const response = await fetch(`${API_URL}/api/guilds/${selectedGuild.id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const newConfig = await response.json();
        setGuildConfig(newConfig);
        if (socket) socket.emit('update-config', { guildId: selectedGuild.id, config: newConfig });
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#a78bfa', fontSize: '1.2rem', fontWeight: 600 }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex">
          <Sidebar guilds={guilds} selectedGuild={selectedGuild} onGuildSelect={handleGuildSelect} />
          <main className="flex-1 p-8">
            {!selectedGuild ? (
              <div className="text-center py-20">
                <h2 className="text-3xl font-bold mb-4">Select a Server</h2>
                <p className="text-gray-400">Choose a server from the sidebar to get started</p>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Dashboard guild={selectedGuild} config={guildConfig} />} />
                <Route path="/automod" element={<AutoMod config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/logging" element={<Logging config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/welcome" element={<Welcome config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/reaction-roles" element={<ReactionRoles config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/custom-commands" element={<CustomCommands config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/tickets" element={<Tickets config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="/settings" element={<Settings config={guildConfig} updateConfig={updateConfig} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
