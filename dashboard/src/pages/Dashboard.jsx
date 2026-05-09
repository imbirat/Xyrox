/**
 * dashboard/src/pages/Dashboard.jsx — Main overview page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';

function StatCard({ icon, label, value, sub, color = '#7c3aed' }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-white">{value ?? '—'}</div>
                <div className="text-sm font-semibold text-gray-400">{label}</div>
                {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

export default function Dashboard({ guild, config, user }) {
    const [stats,   setStats]   = useState(null);
    const [botInfo, setBotInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!guild) return;
        try {
            const [s, b] = await Promise.allSettled([
                api.get(`/api/guilds/${guild.id}/stats`),
                api.get('/api/bot/status'),
            ]);
            if (s.status === 'fulfilled') setStats(s.value);
            if (b.status === 'fulfilled') setBotInfo(b.value);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [guild]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Placeholder chart data
    const chartData = [
        { name: 'Mon', messages: 420 },
        { name: 'Tue', messages: 380 },
        { name: 'Wed', messages: 510 },
        { name: 'Thu', messages: 445 },
        { name: 'Fri', messages: 620 },
        { name: 'Sat', messages: 580 },
        { name: 'Sun', messages: 490 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 animate-pulse">Loading dashboard…</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">{guild.name}</h1>
                    <p className="text-gray-400 text-sm">Server Overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${botInfo?.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-400">
                        Bot {botInfo?.status || 'unknown'} {botInfo?.ping ? `· ${botInfo.ping}ms` : ''}
                    </span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" label="Members"  value={stats?.memberCount?.toLocaleString()} color="#7c3aed" />
                <StatCard icon="🟢" label="Online"   value={stats?.onlineCount?.toLocaleString()} color="#22c55e" />
                <StatCard icon="📢" label="Channels" value={stats?.channelCount} color="#3b82f6" />
                <StatCard icon="🎭" label="Roles"    value={stats?.roleCount}    color="#f59e0b" />
            </div>

            {/* Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4">Message Activity (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#fff' }} />
                        <Line type="monotone" dataKey="messages" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4">Quick Info</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 mb-1">Server Created</div>
                        <div className="text-white text-sm font-semibold">
                            {stats?.createdAt ? new Date(stats.createdAt).toLocaleDateString() : '—'}
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 mb-1">Boost Level</div>
                        <div className="text-white text-sm font-semibold">
                            Level {stats?.boostLevel ?? 0} · {stats?.boostCount ?? 0} boosts
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 mb-1">Command Prefix</div>
                        <div className="text-white text-sm font-semibold font-mono">{config?.prefix || '!'}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 mb-1">Language</div>
                        <div className="text-white text-sm font-semibold">{config?.lang || 'en-US'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
