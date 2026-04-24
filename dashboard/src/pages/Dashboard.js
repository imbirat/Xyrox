import React, { useState, useEffect, useCallback } from 'react';
import { FaServer, FaUsers, FaShieldAlt, FaCog } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Dashboard({ guild, config }) {
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [guild]);

  useEffect(() => {
    if (guild) fetchStats();
  }, [guild, fetchStats]);

  if (!config) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of {guild.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {guild.icon && (
            <img
              src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
              alt={guild.name}
              className="w-16 h-16 rounded-full"
            />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard icon={<FaServer className="text-blue-500" />} label="Server ID" value={guild.id} color="blue" />
        <StatCard icon={<FaShieldAlt className="text-green-500" />} label="AutoMod" value={config.automod?.enabled ? 'Enabled' : 'Disabled'} color={config.automod?.enabled ? 'green' : 'red'} />
        <StatCard icon={<FaCog className="text-purple-500" />} label="Command Mode" value={config.commandMode || 'slash'} color="purple" />
        <StatCard icon={<FaUsers className="text-yellow-500" />} label="Warnings" value={stats?.totalWarnings || 0} color="yellow" />
      </div>

      {/* Feature Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <FeatureStatus label="AutoMod System" enabled={config.automod?.enabled} description="Automatic moderation and filtering" />
          <FeatureStatus label="Anti-Nuke" enabled={config.antinuke?.enabled} description="Protection against mass actions" />
          <FeatureStatus label="Logging" enabled={config.logs?.enabled} description="Track server events" />
          <FeatureStatus label="Welcome Messages" enabled={config.welcome?.enabled} description="Greet new members" />
          <FeatureStatus label="Tickets" enabled={config.tickets?.enabled} description="Support ticket system" />
          <FeatureStatus label="Custom Commands" enabled={(config.customCommands?.length || 0) > 0} description={`${config.customCommands?.length || 0} commands`} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickAction label="Configure AutoMod" description="Setup automatic moderation" link="/automod" color="blue" />
          <QuickAction label="Setup Logging" description="Track server events" link="/logging" color="green" />
          <QuickAction label="Welcome Messages" description="Customize greetings" link="/welcome" color="purple" />
        </div>
      </div>

      {/* Recent Warnings */}
      {stats && config.warnings && config.warnings.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Warnings</h2>
          <div className="space-y-2">
            {config.warnings.slice(-5).reverse().map((warning, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">User ID: {warning.userId}</div>
                    <div className="text-sm text-gray-400">{warning.reason}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(warning.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-600/20 border-blue-600',
    green: 'bg-green-600/20 border-green-600',
    red: 'bg-red-600/20 border-red-600',
    purple: 'bg-purple-600/20 border-purple-600',
    yellow: 'bg-yellow-600/20 border-yellow-600'
  };
  return (
    <div className={`bg-gray-800 border-2 ${colorClasses[color]} rounded-lg p-6`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
      <div className="text-2xl font-bold truncate">{value}</div>
    </div>
  );
}

function FeatureStatus({ label, enabled, description }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg">
      <div className={`mt-1 w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </div>
  );
}

function QuickAction({ label, description, link, color }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };
  return (
    <a href={link} className={`block p-4 ${colorClasses[color]} rounded-lg transition text-center`}>
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-sm opacity-90">{description}</div>
    </a>
  );
}
