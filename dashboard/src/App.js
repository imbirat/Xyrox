import React, { useState, useEffect, useRef } from 'react';
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

// Enable debug logging
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AUTH]', ...args);
const error = (...args) => console.error('[AUTH ERROR]', ...args);

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
              Add to Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildConfig, setGuildConfig] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to prevent double-execution in StrictMode
  const initialized = useRef(false);

  // Connect socket when user is logged in
  useEffect(() => {
    if (user && !socket) {
      log('Connecting socket...');
      const newSocket = io(API_URL, { withCredentials: true });
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user, socket]);

  // Initial auth check — runs once on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    log('Initializing auth flow...');
    log('Token in URL:', token ? 'YES' : 'NO');
    log('Error in URL:', errorParam || 'NO');

    if (errorParam) {
      error('OAuth error from URL:', errorParam);
      setError('Authentication failed. Please try again.');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
      return;
    }

    if (token) {
      log('Token found - starting exchange...');
      exchangeToken(token);
    } else {
      log('No token - checking existing session...');
      fetchUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Exchange the one-time token from URL for user data + session
  const exchangeToken = async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      log('Exchanging token...');
      const url = `${API_URL}/api/auth/exchange?token=${token}&_t=${Date.now()}`;
      log('Exchange URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      log('Exchange response status:', response.status);
      log('Exchange response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        log('Token exchange successful!');
        log('User:', data.user?.username);
        log('Guilds:', data.guilds?.length);
        log('Debug data:', data.debug);
        
        setUser(data.user);
        setGuilds(data.guilds || []);
        
        // CRITICAL: Remove token from URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        log('Token removed from URL');
        
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        error('Token exchange failed:', response.status, errorData);
        setError(`Login failed: ${errorData.error || 'Unknown error'}`);
        setUser(null);
        setGuilds([]);
        
        // Remove failed token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      error('Error during token exchange:', err);
      setError('Network error during login. Please check your connection.');
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
    setError(null);
    
    try {
      log('Fetching user session...');
      const url = `${API_URL}/api/auth/user?_t=${Date.now()}`;
      log('Fetch URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      log('User fetch response status:', response.status);
      log('User fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        log('Session valid!');
        log('User:', data.user?.username);
        log('Guilds:', data.guilds?.length);
        log('Debug data:', data.debug);
        
        setUser(data.user);
        setGuilds(data.guilds || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        log('No valid session:', errorData);
        setUser(null);
        setGuilds([]);
      }
    } catch (err) {
      error('Error fetching user:', err);
      setError('Failed to check authentication status.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    log('Redirecting to Discord OAuth...');
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  const handleLogout = async () => {
    log('Logging out...');
    try {
      await fetch(`${API_URL}/api/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      log('Logout successful');
    } catch (e) { 
      error('Logout error:', e);
    }
    setUser(null);
    setGuilds([]);
    setSelectedGuild(null);
  };

  const handleGuildSelect = async (guild) => {
    log('Guild selected:', guild.name);
    setSelectedGuild(guild);
    try {
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/config`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const config = await response.json();
        setGuildConfig(config);
        log('Guild config loaded');
      }
    } catch (err) {
      error('Error fetching guild config:', err);
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
    } catch (err) {
      error('Error updating config:', err);
    }
  };

  // Show loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0f0a1e', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '1rem'
      }}>
        <div style={{ color: '#a78bfa', fontSize: '1.2rem', fontWeight: 600 }}>Loading…</div>
        {error && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '0.9rem', 
            maxWidth: '400px', 
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Show landing page if not authenticated
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
