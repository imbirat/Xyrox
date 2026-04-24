import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
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

// ─── LANDING PAGE ────────────────────────────────────────────────────────────

function LandingPage({ onLogin }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-brand">
          <h1>Xyrox</h1>
        </div>
        <div className="nav-links">
          <a href="https://xyrox.vercel.app/" className="nav-link">Home</a>
          <a href={ADD_BOT_URL} className="nav-link">Add Bot</a>
          <button onClick={onLogin} className="login-btn">Login</button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Xyrox</h1>
          <p className="hero-subtitle">
            The all-in-one Discord bot for moderation, logging, and server management
          </p>
          <div className="hero-buttons">
            <button onClick={onLogin} className="btn btn-primary">
              Get Started
            </button>
            <a
              href={ADD_BOT_URL}
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Server
            </a>
          </div>
        </div>
      </div>

      <div className="features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>AutoMod System</h3>
            <p>Advanced spam protection and content filtering</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Server Logging</h3>
            <p>Track all server events in real-time</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Reaction Roles</h3>
            <p>Let users self-assign roles with reactions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3>Ticket System</h3>
            <p>Professional support ticket management</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Custom Commands</h3>
            <p>Create your own custom bot commands</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👋</div>
            <h3>Welcome Messages</h3>
            <p>Greet new members with custom messages</p>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2024 Xyrox. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

function App() {
  // Restore from localStorage on first load (survives refresh)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('xyrox_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [guilds, setGuilds] = useState(() => {
    try {
      const saved = localStorage.getItem('xyrox_guilds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ─── AUTH FLOW ───────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    // Clean URL immediately
    if (token || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      console.error('OAuth error:', error);
      alert('Login failed. Please try again.');
      setLoading(false);
      return;
    }

    if (token) {
      // Just came back from OAuth — exchange token for user data
      exchangeToken(token);
    } else {
      // Normal page load — check existing session
      checkSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Exchange one-time token from OAuth redirect
  const exchangeToken = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/exchange?token=${token}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        saveUserData(data.user, data.guilds);
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('Token exchange failed:', error);
        alert('Login failed. Please try again.');
        clearUserData();
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      alert('Connection error. Please check your network and try again.');
      clearUserData();
    } finally {
      setLoading(false);
    }
  };

  // Check if existing session is still valid
  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/user?_=${Date.now()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        saveUserData(data.user, data.guilds);
      } else {
        // Session expired or invalid
        clearUserData();
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Don't clear localStorage on network error — user might just be offline
    } finally {
      setLoading(false);
    }
  };

  // Save user data to state + localStorage
  const saveUserData = (userData, guildsData) => {
    localStorage.setItem('xyrox_user', JSON.stringify(userData));
    localStorage.setItem('xyrox_guilds', JSON.stringify(guildsData));
    setUser(userData);
    setGuilds(guildsData);
  };

  // Clear user data from state + localStorage
  const clearUserData = () => {
    localStorage.removeItem('xyrox_user');
    localStorage.removeItem('xyrox_guilds');
    setUser(null);
    setGuilds([]);
  };

  // Redirect to Discord OAuth
  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearUserData();
    setSelectedGuild(null);
  };

  // Select guild
  const handleGuildSelect = (guild) => {
    setSelectedGuild(guild);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Xyrox...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Sidebar
          guilds={guilds}
          selectedGuild={selectedGuild}
          onGuildSelect={handleGuildSelect}
          isOpen={sidebarOpen}
        />
        <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
          <Navbar
            user={user}
            onLogout={handleLogout}
            onToggleSidebar={toggleSidebar}
          />
          <div className="content">
            {!selectedGuild ? (
              <div className="no-guild-selected">
                <h2>👈 Select a server to get started</h2>
                <p>Choose a server from the sidebar to manage its settings</p>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Dashboard guild={selectedGuild} />} />
                <Route path="/automod" element={<AutoMod guild={selectedGuild} />} />
                <Route path="/logging" element={<Logging guild={selectedGuild} />} />
                <Route path="/welcome" element={<Welcome guild={selectedGuild} />} />
                <Route path="/reaction-roles" element={<ReactionRoles guild={selectedGuild} />} />
                <Route path="/custom-commands" element={<CustomCommands guild={selectedGuild} />} />
                <Route path="/tickets" element={<Tickets guild={selectedGuild} />} />
                <Route path="/settings" element={<Settings guild={selectedGuild} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
