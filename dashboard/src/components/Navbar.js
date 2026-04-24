import React from 'react';
import { FaDiscord, FaSignOutAlt } from 'react-icons/fa';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Xyrox</h1>
            <p className="text-sm text-gray-400">Dashboard</p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <FaDiscord className="text-white text-xl" />
                </div>
              )}
              <div>
                <div className="font-semibold text-white">{user.username}</div>
                <div className="text-xs text-gray-400">#{user.discriminator}</div>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
