/**
 * dashboard/src/App.jsx — Kythia SaaS Dashboard Root
 *
 * Features:
 *  - Discord OAuth2 one-time token exchange on load
 *  - Session persistence via localStorage + live /api/auth/user check
 *  - Socket.IO reconnect banner
 *  - ErrorBoundary prevents white-screen crashes
 *  - All API calls via centralised api utility with credentials: 'include'
 *
 * Deployed at: https://xyrox.qzz.io
 * API backend: https://xyrox-production.up.railway.app
 */

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import Navbar        from './components/shared/Navbar';
import Sidebar       from './components/shared/Sidebar';
import Dashboard     from './pages/Dashboard';
import AutoMod       from './pages/AutoMod';
import Leveling      from './pages/Leveling';
import Welcome       from './pages/Welcome';
import Tickets       from './pages/Tickets';
import ReactionRoles from './pages/ReactionRoles';
import Giveaway      from './pages/Giveaway';
import Economy       from './pages/Economy';
import Logging       from './pages/Logging';
import Modules       from './pages/Modules';
import Settings      from './pages/Settings';
import SendMessage   from './pages/SendMessage';
import ServerSelect  from './pages/ServerSelect';

import { api, ApiError, API_URL } from './utils/api';
import './index.css';

export const ADD_BOT_URL =
    'https://discord.com/oauth2/authorize?client_id=' +
    (import.meta.env.VITE_CLIENT_ID || '') +
    '&permissions=8&integration_type=0&scope=bot';

// ─── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-8">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-red-400 text-2xl font-bold">Something went wrong</h2>
                <p className="text-gray-400 text-center max-w-md">
                    {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                >
                    Reload page
                </button>
            </div>
        );
    }
}

// ─── Socket reconnect banner ───────────────────────────────────────────────────
function ReconnectBanner({ show }) {
    if (!show) return null;
    return (
        <div role="alert" aria-live="polite" className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 text-center py-2 text-sm font-semibold">
            ⚡ Reconnecting to server…
        </div>
    );
}

// ─── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
                    <span className="text-3xl font-black text-white">K</span>
                </div>
                <p className="text-gray-400 text-sm animate-pulse">Loading Kythia…</p>
            </div>
        </div>
    );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                    <span className="text-4xl font-black text-white">K</span>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Kythia
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Your all-in-one Discord bot platform</p>
                </div>
                <button
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-[#5865F2]/20"
                >
                    <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                        <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A38.2 38.2 0 0 0 25.5.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.7 4.9a.2.2 0 0 0-.1.1C1.6 18.1-.9 31 .3 43.7v.1a58.8 58.8 0 0 0 17.9 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.8a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.8a.2.2 0 0 1 0 .4 36.1 36.1 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47.1 47.1 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 18-9v-.1C73.6 29 70.3 16.2 60.2 5Z" fill="currentColor"/>
                    </svg>
                    Login with Discord
                </button>
                <p className="text-gray-500 text-xs text-center">
                    By logging in, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
    const [user,           setUser]           = useState(null);
    const [guilds,         setGuilds]         = useState([]);
    const [selectedGuild,  setSelectedGuild]  = useState(null);
    const [guildConfig,    setGuildConfig]    = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [reconnecting,   setReconnecting]   = useState(false);

    const socketRef = useRef(null);

    // ── Socket.IO (connect only when authenticated) ───────────────────────────
    const connectSocket = useCallback((guildId) => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socket = io(API_URL, {
            withCredentials:  true,
            transports:       ['websocket', 'polling'],
            reconnectionDelay: 2000,
        });

        socket.on('connect',    ()  => { setReconnecting(false); if (guildId) socket.emit('join_guild', guildId); });
        socket.on('disconnect', ()  => setReconnecting(true));
        socket.on('reconnect',  ()  => setReconnecting(false));
        socket.on('config_updated', (cfg) => setGuildConfig(cfg));

        socketRef.current = socket;
    }, []);

    // ── Auth: one-time token exchange or session restore ──────────────────────
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token     = urlParams.get('token');
        const error     = urlParams.get('error');

        if (error) {
            window.history.replaceState({}, '', '/');
            setLoading(false);
            return;
        }

        async function init() {
            try {
                if (token) {
                    window.history.replaceState({}, '', '/');
                    const data = await api.get(`/api/auth/exchange?token=${token}`);
                    setUser(data.user);
                    setGuilds(data.guilds || []);
                } else {
                    const data = await api.get('/api/auth/user');
                    setUser(data.user);
                    setGuilds(data.guilds || []);
                }
            } catch (err) {
                if (!(err instanceof ApiError && err.status === 401)) {
                    console.error('Auth init error:', err);
                }
            } finally {
                setLoading(false);
            }
        }

        init();

        return () => socketRef.current?.disconnect();
    }, []);

    // ── Connect socket after auth ─────────────────────────────────────────────
    useEffect(() => {
        if (user) connectSocket(selectedGuild?.id);
    }, [user, selectedGuild?.id, connectSocket]);

    // ── Guild selection ───────────────────────────────────────────────────────
    async function handleGuildSelect(guild) {
        setSelectedGuild(guild);
        setGuildConfig(null);
        if (socketRef.current) socketRef.current.emit('join_guild', guild.id);

        try {
            const cfg = await api.get(`/api/guilds/${guild.id}/config`);
            setGuildConfig(cfg);
        } catch (err) {
            console.error('Failed to load guild config:', err);
        }
    }

    function handleLogin() {
        window.location.href = `${API_URL}/api/auth/discord`;
    }

    async function handleLogout() {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // ignore
        }
        setUser(null);
        setGuilds([]);
        setSelectedGuild(null);
        setGuildConfig(null);
        socketRef.current?.disconnect();
    }

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) return <LoadingScreen />;
    if (!user)   return <LoginScreen onLogin={handleLogin} />;

    if (!selectedGuild) {
        return (
            <ServerSelect
                guilds={guilds}
                onSelect={handleGuildSelect}
                user={user}
                onLogout={handleLogout}
            />
        );
    }

    const pageProps = {
        guild:  selectedGuild,
        config: guildConfig,
        user,
    };

    return (
        <ErrorBoundary>
            <ReconnectBanner show={reconnecting} />
            <div className="flex min-h-screen bg-gray-950">
                <Sidebar
                    guilds={guilds}
                    selectedGuild={selectedGuild}
                    onGuildSelect={handleGuildSelect}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar user={user} onLogout={handleLogout} />
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Routes>
                            <Route path="/"               element={<Dashboard     {...pageProps} />} />
                            <Route path="/automod"        element={<AutoMod       {...pageProps} />} />
                            <Route path="/leveling"       element={<Leveling      {...pageProps} />} />
                            <Route path="/welcome"        element={<Welcome       {...pageProps} />} />
                            <Route path="/tickets"        element={<Tickets       {...pageProps} />} />
                            <Route path="/reaction-roles" element={<ReactionRoles {...pageProps} />} />
                            <Route path="/giveaways"      element={<Giveaway      {...pageProps} />} />
                            <Route path="/economy"        element={<Economy       {...pageProps} />} />
                            <Route path="/logging"        element={<Logging       {...pageProps} />} />
                            <Route path="/modules"        element={<Modules       {...pageProps} />} />
                            <Route path="/settings"       element={<Settings      {...pageProps} />} />
                            <Route path="/send-message"   element={<SendMessage   {...pageProps} />} />
                            <Route path="*"               element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </ErrorBoundary>
    );
}
