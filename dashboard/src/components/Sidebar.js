import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaShieldAlt, FaFileAlt, FaHandPeace, FaTheaterMasks, 
  FaRobot, FaTicketAlt, FaCog, FaChevronDown, FaChevronLeft
} from 'react-icons/fa';

export default function Sidebar({ guilds, selectedGuild, onGuildSelect }) {
  const location = useLocation();
  const [guildMenuOpen, setGuildMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard', color: 'purple' },
    { path: '/automod', icon: FaShieldAlt, label: 'Auto Moderation', color: 'red' },
    { path: '/logging', icon: FaFileAlt, label: 'Logging', color: 'blue' },
    { path: '/welcome', icon: FaHandPeace, label: 'Welcome', color: 'green' },
    { path: '/reaction-roles', icon: FaTheaterMasks, label: 'Reaction Roles', color: 'yellow' },
    { path: '/custom-commands', icon: FaRobot, label: 'Commands', color: 'indigo' },
    { path: '/tickets', icon: FaTicketAlt, label: 'Tickets', color: 'pink' },
    { path: '/settings', icon: FaCog, label: 'Settings', color: 'gray' }
  ];

  const colorClasses = {
    purple: 'from-purple-600 to-purple-700',
    red: 'from-red-600 to-red-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    yellow: 'from-yellow-600 to-yellow-700',
    indigo: 'from-indigo-600 to-indigo-700',
    pink: 'from-pink-600 to-pink-700',
    gray: 'from-gray-600 to-gray-700',
  };
  
  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-gray-900/95 backdrop-blur-md min-h-screen border-r border-gray-700/50 transition-all duration-300 flex flex-col`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full flex items-center justify-center transition-colors z-10"
      >
        <FaChevronLeft className={`text-gray-400 text-xs transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Guild Selector */}
      <div className="p-4 border-b border-gray-700/50">
        <button
          onClick={() => setGuildMenuOpen(!guildMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all duration-200 group"
        >
          {selectedGuild ? (
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
              {selectedGuild.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=64`}
                  alt={selectedGuild.name}
                  className="w-8 h-8 rounded-lg ring-2 ring-purple-500/50"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold ring-2 ring-purple-500/50">
                  {selectedGuild.name[0]}
                </div>
              )}
              {!collapsed && (
                <>
                  <span className="font-semibold truncate text-white group-hover:text-purple-400 transition-colors">
                    {selectedGuild.name}
                  </span>
                  <FaChevronDown className={`ml-auto text-gray-400 transition-transform ${guildMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </div>
          ) : (
            <>
              {!collapsed && <span className="text-gray-400">Select Server</span>}
              <FaChevronDown className={`text-gray-400 transition-transform ${guildMenuOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        
        {guildMenuOpen && !collapsed && (
          <div className="mt-2 bg-gray-800 border border-gray-700/50 rounded-xl max-h-64 overflow-y-auto shadow-xl">
            {guilds.map(guild => (
              <button
                key={guild.id}
                onClick={() => {
                  onGuildSelect(guild);
                  setGuildMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {guild.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
                    alt={guild.name}
                    className="w-8 h-8 rounded-lg"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    {guild.name[0]}
                  </div>
                )}
                <span className="text-sm truncate text-white font-medium">{guild.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      {selectedGuild && (
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r ' + colorClasses[item.color] + ' text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}
                  <Icon className={`text-xl relative z-10 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  {!collapsed && (
                    <span className="font-semibold relative z-10">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full relative z-10" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-600 text-center">Xyrox Dashboard</p>
        </div>
      )}
    </aside>
  );
}
