import React from 'react';
import { FaDiscord, FaSignOutAlt, FaBell } from 'react-icons/fa';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-2xl font-black text-white">X</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Xyrox
              </h1>
              <p className="text-xs text-gray-400 font-medium">Dashboard v2.0</p>
            </div>
          </div>

          {/* Right Section */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors group">
                <FaBell className="text-gray-400 group-hover:text-white transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                    alt={user.username}
                    className="w-10 h-10 rounded-lg ring-2 ring-purple-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center ring-2 ring-purple-500/50">
                    <FaDiscord className="text-white text-xl" />
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="font-semibold text-white text-sm">{user.username}</div>
                  <div className="text-xs text-gray-400">
                    {user.discriminator !== '0' ? `#${user.discriminator}` : '@' + user.username.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 rounded-lg transition-all duration-200 group"
              >
                <FaSignOutAlt className="text-red-400 group-hover:text-white transition-colors" />
                <span className="hidden md:inline text-red-400 group-hover:text-white font-semibold transition-colors">
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
