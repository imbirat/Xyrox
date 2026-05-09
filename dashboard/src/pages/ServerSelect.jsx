/**
 * dashboard/src/pages/ServerSelect.jsx
 *
 * Displays user's guilds grouped by: Bot Installed / Add Bot.
 * Mirrors Xyrox ServerSelect page behaviour.
 */

import React, { useState } from 'react';
import { ADD_BOT_URL } from '../App';

export default function ServerSelect({ guilds, onSelect, user, onLogout }) {
    const [search, setSearch] = useState('');

    const filtered = guilds.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()),
    );

    const withBot    = filtered.filter((g) => g.hasBot);
    const withoutBot = filtered.filter((g) => !g.hasBot);

    function GuildCard({ guild }) {
        return (
            <div
                onClick={() => guild.hasBot && onSelect(guild)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                    guild.hasBot
                        ? 'bg-gray-900 border-gray-800 hover:border-purple-500/50 hover:bg-gray-800/80'
                        : 'bg-gray-900/50 border-gray-800/50 opacity-60'
                }`}
            >
                {guild.icon
                    ? <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`} alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {guild.name[0]}
                      </div>
                }
                <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{guild.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {guild.hasBot ? '✅ Bot installed' : '➕ Add bot'}
                    </div>
                </div>
                {guild.hasBot
                    ? <span className="text-purple-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">→</span>
                    : <a
                        href={`${ADD_BOT_URL}&guild_id=${guild.id}`}
                        target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Add
                      </a>
                }
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="bg-gray-900/95 border-b border-gray-800/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                        <span className="text-xl font-black text-white">K</span>
                    </div>
                    <span className="text-xl font-black text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Kythia</span>
                </div>
                <div className="flex items-center gap-3">
                    {user.avatar && (
                        <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="" className="w-8 h-8 rounded-lg" />
                    )}
                    <button onClick={onLogout} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Logout</button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-white mb-2">Select a Server</h1>
                    <p className="text-gray-400">Choose a server to manage with Kythia</p>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    <input
                        type="text"
                        placeholder="Search servers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* With bot */}
                {withBot.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            My Servers — {withBot.length}
                        </h2>
                        <div className="flex flex-col gap-2">
                            {withBot.map((g) => <GuildCard key={g.id} guild={g} />)}
                        </div>
                    </div>
                )}

                {/* Without bot */}
                {withoutBot.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Add Kythia — {withoutBot.length}
                        </h2>
                        <div className="flex flex-col gap-2">
                            {withoutBot.map((g) => <GuildCard key={g.id} guild={g} />)}
                        </div>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        No servers found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
}
