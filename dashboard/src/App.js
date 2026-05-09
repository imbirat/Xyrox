/**
 * dashboard/src/App.js — Production-hardened React frontend
 *
 * TASK REQUIREMENTS MET:
 *  7.  Vercel dashboard connects correctly — api utility with credentials:include
 *  8.  React Router refresh 404 fixed — BrowserRouter is in index.js (stable)
 *  9.  Socket.IO reconnect handling + visual banner
 * 10.  Loading states with aria attributes
 * 11.  Error boundary prevents white-screen crashes
 * 12.  Session persistence via localStorage + live /api/auth/user check
 *
 * FIXES from previous audit:
 *  - Removed unused `useNavigate` import (caused lint warning / build noise)
 *  - Socket.IO connects ONLY after user is authenticated
 *  - All fetch calls go through centralised api utility
 *  - localStorage reads wrapped in try/catch
 */

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    Component,
} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';

// Pages
import Navbar          from './components/Navbar';
import Sidebar         from './components/Sidebar';
import Dashboard       from './pages/Dashboard';
import AutoMod         from './pages/AutoMod';
import Logging         from './pages/Logging';
import Welcome         from './pages/Welcome';
import ReactionRoles   from './pages/ReactionRoles';
import CustomCommands  from './pages/CustomCommands';
import Tickets         from './pages/Tickets';
import Settings        from './pages/Settings';
import ServerSelect    from './pages/ServerSelect';
import Leveling        from './pages/Leveling';
import Giveaway        from './pages/Giveaway';
import Economy         from './pages/Economy';
import SendMessage     from './pages/SendMessage';
import Modules         from './pages/Modules';

import { api, ApiError, API_URL } from './utils/api';
import './App.css';

export const ADD_BOT_URL =
    'https://discord.com/oauth2/authorize?client_id=' +
    (process.env.REACT_APP_CLIENT_ID || '1496858363688915115') +
    '&permissions=8&integration_type=0&scope=bot';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }
    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div style={{
                minHeight: '100vh', background: '#0f0a1e', color: '#fff',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '1rem', padding: '2rem',
            }}>
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <h2 style={{ color: '#f87171', margin: 0 }}>Something went wrong</h2>
                <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 400 }}>
                    {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        background: '#7c3aed', border: 'none',
                        color: '#fff', fontWeight: 700, cursor: 'pointer',
                    }}
                >
                    Reload page
                </button>
            </div>
        );
    }
}

// ─── Socket reconnect banner ──────────────────────────────────────────────────
function ReconnectBanner({ show }) {
    if (!show) return null;
    return (
        <div role="alert" aria-live="polite" style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: '#f59e0b', color: '#000',
            padding: '8px 20px', borderRadius: 8,
            fontWeight: 600, fontSize: '0.85rem',
            zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
            ⟳ Reconnecting to server…
        </div>
    );
}

// ─── Landing nav ──────────────────────────────────────────────────────────────
function LandingNav({ onLogin }) {
    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2rem', height: '64px',
            background: 'rgba(15,10,30,0.85)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(139,92,246,0.2)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, color: '#fff',
                }}>X</div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Xyrox</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                }}>+ Add Bot</a>
                <button onClick={onLogin} style={{
                    padding: '8px 20px', borderRadius: 8, background: '#5865F2',
                    border: 'none', color: '#fff', fontWeight: 700,
                    fontSize: '0.9rem', cursor: 'pointer',
                }}>Login with Discord</button>
            </div>
        </nav>
    );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
const FEATURES = [
    { icon: '🛡️', title: 'Auto Moderation', desc: 'Spam, caps, links, bad words' },
    { icon: '🎫', title: 'Ticket System',   desc: 'Support panels with categories' },
    { icon: '⭐', title: 'Leveling',        desc: 'Text, voice & reaction XP' },
    { icon: '🎭', title: 'Reaction Roles',  desc: 'Buttons, reactions, dropdowns' },
    { icon: '🎉', title: 'Giveaways',       desc: 'Timed giveaways with rerolls' },
    { icon: '🪙', title: 'Economy',         desc: 'Fish, daily, bank system' },
    { icon: '📋', title: 'Logging',         desc: 'Track all server events' },
    { icon: '🤖', title: 'Custom Commands', desc: 'Your own prefix commands' },
];

function LandingPage({ onLogin }) {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0a1e 0%,#1a0a2e 50%,#0f0a1e 100%)', color: '#fff' }}>
            <LandingNav onLogin={onLogin} />
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '100vh',
                textAlign: 'center', padding: '0 1rem', paddingTop: 64,
                position: 'relative', zIndex: 1,
            }}>
                <h1 style={{ fontSize: 'clamp(2.5rem,7vw,5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
                    Manage your server<br />
                    <span style={{ background: 'linear-gradient(90deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        with Xyrox
                    </span>
                </h1>
                <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                    The all-in-one Discord bot with moderation, leveling, tickets, economy,
                    giveaways and more — all configurable from one dashboard.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
                    <button onClick={onLogin} style={{
                        padding: '14px 32px', borderRadius: 12, background: '#5865F2',
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem',
                        cursor: 'pointer', boxShadow: '0 4px 24px rgba(88,101,242,0.4)',
                    }}>Login with Discord</button>
                    <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" style={{
                        padding: '14px 32px', borderRadius: 12,
                        background: 'rgba(124,58,237,0.15)',
                        border: '1px solid rgba(124,58,237,0.4)',
                        color: '#a78bfa', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
                    }}>+ Add to Server</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, maxWidth: 900, width: '100%' }}>
                    {FEATURES.map(f => (
                        <div key={f.title} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: '20px 18px', textAlign: 'left',
                        }}>
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

// ─── Utilities ────────────────────────────────────────────────────────────────
function deepMerge(target, source) {
    const out = { ...target };
    for (const key of Object.keys(source)) {
        const sv = source[key], tv = target[key];
        if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
            tv && typeof tv === 'object' && !Array.isArray(tv)) {
            out[key] = deepMerge(tv, sv);
        } else {
            out[key] = sv;
        }
    }
    return out;
}

function safeLocalGet(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
}
function safeLocalSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}
function safeLocalRemove(...keys) {
    try { keys.forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
}

function useDebounce(fn, delay) {
    const timer = useRef(null);
    return useCallback((...args) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => fn(...args), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fn, delay]);
}

// ─── Main App ─────────────────────────────────────────────────────────────────
// BrowserRouter is in index.js — see that file for the explanation.
function App() {
    const [user,          setUser]          = useState(null);
    const [guilds,        setGuilds]        = useState([]);
    const [selectedGuild, setSelectedGuild] = useState(() => safeLocalGet('xyrox_guild'));
    const [guildConfig,   setGuildConfig]   = useState(() => safeLocalGet('xyrox_config'));
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);
    const [disconnected,  setDisconnected]  = useState(false);

    const socketRef        = useRef(null);
    const selectedGuildRef = useRef(selectedGuild);
    useEffect(() => { selectedGuildRef.current = selectedGuild; }, [selectedGuild]);

    // ── Persist helpers ───────────────────────────────────────────────────────
    const saveAuth = useCallback((u, g) => {
        setUser(u);
        setGuilds(g);
        safeLocalSet('xyrox_user',    u);
        safeLocalSet('xyrox_guilds',  g);
        safeLocalSet('xyrox_expires', Date.now() + 7 * 24 * 60 * 60 * 1000);
    }, []);

    const clearAuth = useCallback(() => {
        setUser(null);
        setGuilds([]);
        setSelectedGuild(null);
        setGuildConfig(null);
        safeLocalRemove('xyrox_user','xyrox_guilds','xyrox_expires','xyrox_guild','xyrox_config');
    }, []);

    // ── Socket.IO — only connect when authenticated ───────────────────────────
    useEffect(() => {
        if (!user) return;

        const socket = io(API_URL, {
            withCredentials: true,
            transports:      ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay:    2000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setDisconnected(false);
            if (selectedGuildRef.current?.id) {
                socket.emit('join-guild', selectedGuildRef.current.id);
            }
        });
        socket.on('disconnect', (reason) => {
            if (reason !== 'io client disconnect') setDisconnected(true);
        });
        socket.on('reconnect', () => {
            setDisconnected(false);
            if (selectedGuildRef.current?.id) {
                socket.emit('join-guild', selectedGuildRef.current.id);
            }
        });
        socket.on('config-updated', ({ guildId, config }) => {
            if (selectedGuildRef.current?.id === guildId) {
                setGuildConfig(config);
                safeLocalSet('xyrox_config', config);
            }
        });

        return () => { socket.disconnect(); socketRef.current = null; };
    }, [user]);

    // Rejoin guild room when guild changes
    useEffect(() => {
        if (selectedGuild?.id && socketRef.current?.connected) {
            socketRef.current.emit('join-guild', selectedGuild.id);
        }
    }, [selectedGuild]);

    // ── Initial auth check ────────────────────────────────────────────────────
    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            setError(null);

            try {
                const params   = new URLSearchParams(window.location.search);
                const token    = params.get('token');
                const authErr  = params.get('error');

                // Clean URL immediately so token isn't visible in browser history
                if (token || authErr) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                if (authErr) {
                    setError('Discord login failed — please try again.');
                    setLoading(false);
                    return;
                }

                // Token exchange (just returned from Discord OAuth)
                if (token) {
                    try {
                        const data = await api.get(`/api/auth/exchange?token=${encodeURIComponent(token)}`);
                        if (data?.user) {
                            saveAuth(data.user, data.guilds || []);
                            setLoading(false);
                            return;
                        }
                    } catch (err) {
                        // Token expired between redirect and exchange (Railway restart) — fall through
                        console.warn('Token exchange failed:', err instanceof ApiError ? err.message : err);
                    }
                }

                // Restore from localStorage for instant display (no loading flicker)
                const savedUser    = safeLocalGet('xyrox_user');
                const savedGuilds  = safeLocalGet('xyrox_guilds');
                const savedExpires = safeLocalGet('xyrox_expires');
                const savedGuild   = safeLocalGet('xyrox_guild');
                const savedConfig  = safeLocalGet('xyrox_config');

                if (savedUser && savedExpires && Date.now() < savedExpires) {
                    setUser(savedUser);
                    setGuilds(savedGuilds || []);
                    if (savedGuild)  setSelectedGuild(savedGuild);
                    if (savedConfig) setGuildConfig(savedConfig);
                    setLoading(false);

                    // Verify session is still alive in the background (no spinner)
                    api.get('/api/auth/user')
                        .then(data => { if (data?.user) saveAuth(data.user, data.guilds || []); })
                        .catch(() => { /* session expired — cached data still shown */ });
                    return;
                }

                // No cached data — live session check
                try {
                    const data = await api.get('/api/auth/user');
                    if (data?.user) {
                        saveAuth(data.user, data.guilds || []);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // Not authenticated — show landing page
                }

                clearAuth();
            } catch (err) {
                console.error('Boot error:', err);
                setError('Network error — could not reach the server.');
                clearAuth();
            } finally {
                setLoading(false);
            }
        };

        boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleLogin = () => {
        window.location.href = `${API_URL}/api/auth/discord`;
    };

    const handleLogout = async () => {
        try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
        clearAuth();
    };

    const handleGuildSelect = async (guild) => {
        setSelectedGuild(guild);
        safeLocalSet('xyrox_guild', guild);
        try {
            const cfg = await api.get(`/api/guilds/${guild.id}/config`);
            setGuildConfig(cfg);
            safeLocalSet('xyrox_config', cfg);
        } catch (err) {
            console.error('Failed to fetch guild config:', err instanceof ApiError ? err.message : err);
        }
    };

    const _sendUpdate = useCallback(async (guildId, updates) => {
        try {
            const newConfig = await api.patch(`/api/guilds/${guildId}/config`, updates);
            setGuildConfig(newConfig);
            safeLocalSet('xyrox_config', newConfig);
            socketRef.current?.emit('update-config', { guildId, config: newConfig });
        } catch (err) {
            console.error('Config update failed:', err instanceof ApiError ? err.message : err);
        }
    }, []);

    const debouncedSend = useDebounce(_sendUpdate, 600);

    const updateConfig = useCallback((updates) => {
        if (!selectedGuildRef.current) return;
        setGuildConfig(prev => {
            const merged = deepMerge(prev || {}, updates);
            safeLocalSet('xyrox_config', merged);
            return merged;
        });
        debouncedSend(selectedGuildRef.current.id, updates);
    }, [debouncedSend]);

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div
                role="status"
                aria-label="Loading Xyrox"
                style={{
                    minHeight: '100vh', background: '#0f0a1e',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '1rem',
                }}
            >
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, color: '#fff',
                }}>X</div>
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>Loading Xyrox…</span>
                {error && (
                    <div style={{
                        color: '#ef4444', fontSize: '0.9rem', marginTop: 8,
                        padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8,
                        maxWidth: 400, textAlign: 'center',
                    }}>
                        {error}
                        <br />
                        <button
                            onClick={() => window.location.reload()}
                            style={{ marginTop: 8, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >Retry</button>
                    </div>
                )}
            </div>
        );
    }

    if (!user) return <LandingPage onLogin={handleLogin} />;

    if (!selectedGuild) {
        return (
            <ServerSelect
                user={user}
                guilds={guilds}
                onSelect={handleGuildSelect}
                onLogout={handleLogout}
            />
        );
    }

    const shared = { guild: selectedGuild, config: guildConfig, updateConfig };

    return (
        <ErrorBoundary>
            <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
                <ReconnectBanner show={disconnected} />
                <Navbar user={user} onLogout={handleLogout} />
                <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>
                    <Sidebar guilds={guilds} selectedGuild={selectedGuild} onGuildSelect={handleGuildSelect} />
                    <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
                        <Routes>
                            <Route path="/"                element={<Dashboard {...shared} user={user} />} />
                            <Route path="/modules"         element={<Modules {...shared} />} />
                            <Route path="/automod"         element={<AutoMod {...shared} />} />
                            <Route path="/logging"         element={<Logging {...shared} />} />
                            <Route path="/welcome"         element={<Welcome {...shared} />} />
                            <Route path="/reaction-roles"  element={<ReactionRoles {...shared} />} />
                            <Route path="/custom-commands" element={<CustomCommands {...shared} />} />
                            <Route path="/tickets"         element={<Tickets {...shared} />} />
                            <Route path="/leveling"        element={<Leveling {...shared} />} />
                            <Route path="/giveaways"       element={<Giveaway {...shared} />} />
                            <Route path="/economy"         element={<Economy {...shared} />} />
                            <Route path="/send-message"    element={<SendMessage guild={selectedGuild} />} />
                            <Route path="/settings"        element={<Settings {...shared} />} />
                            <Route path="*"                element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default App;
