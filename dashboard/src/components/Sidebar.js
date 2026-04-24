import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaShieldAlt, FaFileAlt, FaHandPeace, FaTheaterMasks, FaRobot, FaTicketAlt, FaCog, FaChevronDown } from 'react-icons/fa';

export default function Sidebar({ guilds, selectedGuild, onGuildSelect }) {
  const location = useLocation();
  const [guildMenuOpen, setGuildMenuOpen] = React.useState(false);
  
  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/automod', icon: FaShieldAlt, label: 'AutoMod' },
    { path: '/logging', icon: FaFileAlt, label: 'Logging' },
    { path: '/welcome', icon: FaHandPeace, label: 'Welcome' },
    { path: '/reaction-roles', icon: FaTheaterMasks, label: 'Reaction Roles' },
    { path: '/custom-commands', icon: FaRobot, label: 'Custom Commands' },
    { path: '/tickets', icon: FaTicketAlt, label: 'Tickets' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ];
  
  return (
    <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
      {/* Guild Selector */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => setGuildMenuOpen(!guildMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          {selectedGuild ? (
            <div className="flex items-center gap-3">
              {selectedGuild.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                  alt={selectedGuild.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {selectedGuild.name[0]}
                </div>
              )}
              <span className="font-semibold truncate">{selectedGuild.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">Select Server</span>
          )}
          <FaChevronDown className={`transition-transform ${guildMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {guildMenuOpen && (
          <div className="mt-2 bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
            {guilds.map(guild => (
              <button
                key={guild.id}
                onClick={() => {
                  onGuildSelect(guild);
                  setGuildMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-600 transition"
              >
                {guild.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                    alt={guild.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {guild.name[0]}
                  </div>
                )}
                <span className="text-sm truncate">{guild.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      {selectedGuild && (
        <nav className="p-4">
          <div className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </aside>
  );
}
