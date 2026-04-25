import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaServer, FaUsers, FaTerminal, FaShieldAlt, FaCog, FaChartLine,
  FaUserPlus, FaBan, FaExclamationTriangle, FaCheckCircle, FaCircle
} from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Dashboard({ guild, config, user }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [recentCommands, setRecentCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [botStatus, setBotStatus] = useState('online');
  const [ping, setPing] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [guild]);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/logs?limit=10`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, [guild]);

  const fetchRecentCommands = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/guilds/${guild.id}/commands/recent?limit=10`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRecentCommands(data.commands || []);
      }
    } catch (err) {
      console.error('Error fetching commands:', err);
    }
  }, [guild]);

  const fetchBotStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/bot/status`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBotStatus(data.status || 'online');
        setPing(data.ping || null);
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    }
  }, []);

  useEffect(() => {
    if (guild) {
      fetchStats();
      fetchLogs();
      fetchRecentCommands();
      fetchBotStatus();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchStats();
        fetchBotStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [guild, fetchStats, fetchLogs, fetchRecentCommands, fetchBotStatus]);

  // Mock data for charts (replace with real API data)
  const activityData = stats?.activityOverTime || [
    { time: '00:00', messages: 45, commands: 12 },
    { time: '04:00', messages: 23, commands: 5 },
    { time: '08:00', messages: 89, commands: 28 },
    { time: '12:00', messages: 156, commands: 45 },
    { time: '16:00', messages: 234, commands: 67 },
    { time: '20:00', messages: 198, commands: 52 },
  ];

  const commandsData = stats?.commandsUsage || [
    { name: '/help', count: 145 },
    { name: '/info', count: 89 },
    { name: '/warn', count: 34 },
    { name: '/ban', count: 12 },
    { name: '/kick', count: 18 },
  ];

  const moderationData = stats?.moderationBreakdown || [
    { name: 'Warnings', value: 45, color: '#fbbf24' },
    { name: 'Kicks', value: 18, color: '#fb923c' },
    { name: 'Bans', value: 12, color: '#ef4444' },
    { name: 'Timeouts', value: 23, color: '#a78bfa' },
  ];

  if (loading && !stats) {
    return <LoadingSkeleton />;
  }

  const totalMembers = stats?.totalMembers || guild.memberCount || 0;
  const activeUsers = stats?.activeUsers || Math.floor(totalMembers * 0.3);
  const commandsToday = stats?.commandsToday || recentCommands.length || 0;
  const moderationActions = stats?.moderationActionsToday || (moderationData.reduce((sum, item) => sum + item.value, 0));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.username || 'User'}! 👋
            </h1>
            <p className="text-gray-300">
              Here's what's happening with <span className="font-semibold text-purple-400">{guild.name}</span>
            </p>
          </div>
          {guild.icon && (
            <img
              src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`}
              alt={guild.name}
              className="w-20 h-20 rounded-full border-4 border-purple-500/50"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <FaExclamationTriangle className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaUsers className="text-blue-400" />}
          label="Total Members"
          value={totalMembers.toLocaleString()}
          change="+12%"
          isPositive={true}
          color="blue"
        />
        <StatCard
          icon={<FaCircle className="text-green-400" />}
          label="Active Users"
          value={activeUsers.toLocaleString()}
          change="+8%"
          isPositive={true}
          color="green"
        />
        <StatCard
          icon={<FaTerminal className="text-purple-400" />}
          label="Commands Today"
          value={commandsToday.toLocaleString()}
          change="+23%"
          isPositive={true}
          color="purple"
        />
        <StatCard
          icon={<FaShieldAlt className="text-yellow-400" />}
          label="Moderation Actions"
          value={moderationActions.toLocaleString()}
          change="-5%"
          isPositive={false}
          color="yellow"
        />
      </div>

      {/* Server Overview */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaServer className="text-purple-400" />
          Server Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
            <div className="text-sm text-gray-400 mb-1">Server ID</div>
            <div className="text-lg font-mono text-white">{guild.id}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
            <div className="text-sm text-gray-400 mb-1">Bot Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${botStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-lg font-semibold text-white capitalize">{botStatus}</span>
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
            <div className="text-sm text-gray-400 mb-1">Bot Latency</div>
            <div className="text-lg font-semibold text-white">
              {ping !== null ? `${ping}ms` : 'Calculating...'}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-400" />
            Activity Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="commands" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commands Usage Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaTerminal className="text-purple-400" />
            Top Commands
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={commandsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Moderation Breakdown */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-yellow-400" />
          Moderation Breakdown
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={moderationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {moderationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center space-y-3">
            {moderationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white font-medium">{item.name}</span>
                </div>
                <span className="text-xl font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Logs</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <LogEntry key={index} log={log} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No recent logs</div>
            )}
          </div>
        </div>

        {/* Recent Commands */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Commands</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentCommands.length > 0 ? (
              recentCommands.map((cmd, index) => (
                <CommandEntry key={index} command={cmd} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No recent commands</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, isPositive, color }) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30',
    green: 'from-green-600/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl">{icon}</div>
        <div className={`text-sm font-semibold px-2 py-1 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {change}
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

function LogEntry({ log }) {
  const getIcon = (type) => {
    switch (type) {
      case 'join': return <FaUserPlus className="text-green-400" />;
      case 'ban': return <FaBan className="text-red-400" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-400" />;
      default: return <FaCheckCircle className="text-blue-400" />;
    }
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30 hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon(log.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{log.action || log.type}</div>
          <div className="text-sm text-gray-400 truncate">{log.details || log.userId}</div>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Now'}
        </div>
      </div>
    </div>
  );
}

function CommandEntry({ command }) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30 hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-purple-400 font-medium">{command.name || command.command}</div>
          <div className="text-sm text-gray-400 truncate">
            by {command.user || command.userId}
          </div>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {command.timestamp ? new Date(command.timestamp).toLocaleTimeString() : 'Now'}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-800/50 rounded-xl h-32" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-800/50 rounded-xl h-32" />
        ))}
      </div>
      <div className="bg-gray-800/50 rounded-xl h-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl h-64" />
        <div className="bg-gray-800/50 rounded-xl h-64" />
      </div>
    </div>
  );
}
