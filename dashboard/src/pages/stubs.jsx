/**
 * dashboard/src/pages/stubs.jsx
 *
 * Functional stub pages for all Kythia feature routes.
 * Each loads its own addon config from the API and renders settings.
 * Export each individually for named imports in App.jsx.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

// ─── Reusable toggle component ────────────────────────────────────────────────
function Toggle({ enabled, onChange, label, description }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div>
                <div className="text-white text-sm font-semibold">{label}</div>
                {description && <div className="text-gray-400 text-xs mt-0.5">{description}</div>}
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );
}

// ─── Page scaffold ────────────────────────────────────────────────────────────
function PageShell({ title, icon, children, loading }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-white">{icon} {title}</h1>
                <p className="text-gray-400 text-sm">Configure {title} settings for your server</p>
            </div>
            {loading
                ? <div className="text-gray-500 animate-pulse">Loading…</div>
                : children
            }
        </div>
    );
}

// ─── AutoMod ──────────────────────────────────────────────────────────────────
export function AutoMod({ guild, config }) {
    const [settings, setSettings] = useState(null);
    const [saving,   setSaving]   = useState(false);

    useEffect(() => {
        if (!guild) return;
        api.get(`/api/addons/automod/${guild.id}`)
            .then(setSettings)
            .catch(() => setSettings({ automodOn: false }));
    }, [guild]);

    async function save(key, value) {
        setSaving(true);
        try {
            const updated = await api.patch(`/api/addons/automod/${guild.id}`, { [key]: value });
            setSettings(updated);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell title="Auto Moderation" icon="🛡️" loading={!settings}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <Toggle enabled={settings?.antiSpam}   onChange={(v) => save('antiSpam', v)}   label="Anti-Spam"    description="Detect and remove repeated messages" />
                <Toggle enabled={settings?.antiCaps}   onChange={(v) => save('antiCaps', v)}   label="Anti-Caps"    description="Block excessive capital letters" />
                <Toggle enabled={settings?.antiLinks}  onChange={(v) => save('antiLinks', v)}  label="Anti-Links"   description="Block unauthorized URLs" />
                <Toggle enabled={settings?.antiInvite} onChange={(v) => save('antiInvite', v)} label="Anti-Invites" description="Block Discord invite links" />
                <Toggle enabled={settings?.antiBadword} onChange={(v) => save('antiBadword', v)} label="Bad Words"  description="Custom profanity filter" />
                <Toggle enabled={settings?.antiZalgo}  onChange={(v) => save('antiZalgo', v)}  label="Anti-Zalgo"   description="Block Zalgo/cursed text" />
            </div>
            {saving && <div className="text-purple-400 text-sm">Saving…</div>}
        </PageShell>
    );
}

// ─── Leveling ─────────────────────────────────────────────────────────────────
export function Leveling({ guild }) {
    const [data,    setData]    = useState(null);
    const [leaderboard, setLB] = useState([]);

    useEffect(() => {
        if (!guild) return;
        api.get(`/api/addons/leveling/${guild.id}`).then(setData).catch(console.error);
        api.get(`/api/guilds/${guild.id}/leaderboard?type=xp&limit=10`).then(setLB).catch(console.error);
    }, [guild]);

    return (
        <PageShell title="Leveling" icon="⭐" loading={!data}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">XP Leaderboard</h2>
                {leaderboard.length === 0
                    ? <div className="text-gray-500 text-sm">No leveling data yet.</div>
                    : leaderboard.map((row, i) => (
                        <div key={row.userId} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 text-sm w-5">#{i + 1}</span>
                                <span className="text-white text-sm">{row.username || row.userId}</span>
                            </div>
                            <div className="text-purple-400 text-sm font-semibold">Lv.{row.level} · {row.xp?.toLocaleString()} XP</div>
                        </div>
                    ))
                }
            </div>
        </PageShell>
    );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────
export function Welcome({ guild }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!guild) return;
        api.get(`/api/addons/welcome/${guild.id}`).then(setData).catch(() => setData({}));
    }, [guild]);
    return (
        <PageShell title="Welcome & Farewell" icon="👋" loading={!data}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <Toggle enabled={!!data?.welcomeInOn}  onChange={() => {}} label="Welcome Messages"  description="Greet new members" />
                <Toggle enabled={!!data?.welcomeOutOn} onChange={() => {}} label="Farewell Messages" description="Say goodbye to leaving members" />
            </div>
        </PageShell>
    );
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export function Tickets({ guild }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!guild) return;
        api.get(`/api/addons/tickets/${guild.id}`).then(setData).catch(() => setData({}));
    }, [guild]);
    return (
        <PageShell title="Ticket System" icon="🎫" loading={!data}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400 text-sm">
                Ticket configuration panel — configure support channels, categories, and staff roles.
            </div>
        </PageShell>
    );
}

// ─── Reaction Roles ───────────────────────────────────────────────────────────
export function ReactionRoles({ guild }) {
    return (
        <PageShell title="Reaction Roles" icon="🎭" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400 text-sm">
                Manage emoji, button, and select menu based role assignment.
            </div>
        </PageShell>
    );
}

// ─── Giveaway ─────────────────────────────────────────────────────────────────
export function Giveaway({ guild }) {
    return (
        <PageShell title="Giveaways" icon="🎉" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400 text-sm">
                Create and manage server giveaways.
            </div>
        </PageShell>
    );
}

// ─── Economy ──────────────────────────────────────────────────────────────────
export function Economy({ guild }) {
    const [leaderboard, setLB] = useState([]);
    useEffect(() => {
        if (!guild) return;
        api.get(`/api/guilds/${guild.id}/leaderboard?type=economy`).then(setLB).catch(console.error);
    }, [guild]);
    return (
        <PageShell title="Economy" icon="🪙" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">Richest Members</h2>
                {leaderboard.length === 0
                    ? <div className="text-gray-500 text-sm">No economy data yet.</div>
                    : leaderboard.map((row, i) => (
                        <div key={row.userId} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                            <span className="text-white text-sm">#{i + 1} {row.username || row.userId}</span>
                            <span className="text-yellow-400 font-semibold text-sm">🪙 {row.balance?.toLocaleString()}</span>
                        </div>
                    ))
                }
            </div>
        </PageShell>
    );
}

// ─── Logging ──────────────────────────────────────────────────────────────────
export function Logging({ guild, config }) {
    return (
        <PageShell title="Logging" icon="📋" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400 text-sm">
                Configure which events are logged and where. Current log channel:{' '}
                <span className="text-white font-mono">{config?.logChannelId || 'Not set'}</span>
            </div>
        </PageShell>
    );
}

// ─── Modules ──────────────────────────────────────────────────────────────────
export function Modules({ guild }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!guild) return;
        api.get(`/api/addons/list/${guild.id}`).then(setData).catch(() => setData([]));
    }, [guild]);
    return (
        <PageShell title="Modules" icon="🧩" loading={!data}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(Array.isArray(data) ? data : []).map((addon) => (
                    <div key={addon.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                        <div className="text-white font-semibold text-sm">{addon.name}</div>
                        <div className="text-gray-500 text-xs mt-1 line-clamp-2">{addon.description}</div>
                        <div className={`text-xs mt-2 font-semibold ${addon.enabled ? 'text-green-400' : 'text-gray-600'}`}>
                            {addon.enabled ? '● Enabled' : '○ Disabled'}
                        </div>
                    </div>
                ))}
            </div>
        </PageShell>
    );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function Settings({ guild, config }) {
    const [prefix, setPrefix] = useState(config?.prefix || '!');
    const [lang,   setLang]   = useState(config?.lang   || 'en-US');
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    async function save() {
        setSaving(true);
        try {
            await api.patch(`/api/guilds/${guild.id}/config`, { prefix, lang });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell title="Settings" icon="⚙️" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Command Prefix</label>
                    <input
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        maxLength={5}
                        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Language</label>
                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    >
                        <option value="en-US">English (US)</option>
                        <option value="fr-FR">Français</option>
                        <option value="de-DE">Deutsch</option>
                        <option value="es-ES">Español</option>
                        <option value="pt-BR">Português (BR)</option>
                        <option value="ja-JP">日本語</option>
                    </select>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {saved ? '✅ Saved!' : saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </PageShell>
    );
}

// ─── Send Message ─────────────────────────────────────────────────────────────
export function SendMessage({ guild }) {
    const [channels, setChannels] = useState([]);
    const [channel,  setChannel]  = useState('');
    const [content,  setContent]  = useState('');
    const [sending,  setSending]  = useState(false);
    const [result,   setResult]   = useState(null);

    useEffect(() => {
        if (!guild) return;
        api.get(`/api/guilds/${guild.id}/channels`)
            .then((ch) => setChannels(ch.filter((c) => c.type === 0)))
            .catch(console.error);
    }, [guild]);

    async function send() {
        if (!channel || !content.trim()) return;
        setSending(true);
        setResult(null);
        try {
            const r = await api.post(`/api/guilds/${guild.id}/send-message`, { channelId: channel, content });
            setResult({ success: true, messageId: r.messageId });
            setContent('');
        } catch (err) {
            setResult({ success: false, error: err.message });
        } finally {
            setSending(false);
        }
    }

    return (
        <PageShell title="Send Message" icon="📣" loading={false}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Channel</label>
                    <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                    >
                        <option value="">Select a channel…</option>
                        {channels.map((c) => (
                            <option key={c.id} value={c.id}>#{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Message</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        placeholder="Type your message…"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    />
                </div>
                {result && (
                    <div className={`text-sm rounded-xl px-4 py-3 ${result.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {result.success ? `✅ Message sent (ID: ${result.messageId})` : `❌ ${result.error}`}
                    </div>
                )}
                <button
                    onClick={send}
                    disabled={sending || !channel || !content.trim()}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {sending ? 'Sending…' : 'Send Message'}
                </button>
            </div>
        </PageShell>
    );
}
