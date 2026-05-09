/**
 * dashboard/src/components/shared/Navbar.jsx
 */

import React from 'react';

export default function Navbar({ user, onLogout }) {
    return (
        <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-40 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <span className="text-xl font-black text-white">K</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            Kythia
                        </h1>
                        <p className="text-xs text-gray-500">Dashboard v2.0</p>
                    </div>
                </div>

                {/* User */}
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50">
                            {user.avatar
                                ? <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`} alt={user.username} className="w-8 h-8 rounded-lg ring-2 ring-purple-500/50" />
                                : <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center ring-2 ring-purple-500/50">
                                    <span className="text-white text-sm font-bold">{user.username[0]?.toUpperCase()}</span>
                                  </div>
                            }
                            <span className="text-white text-sm font-semibold hidden md:block">{user.global_name || user.username}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
