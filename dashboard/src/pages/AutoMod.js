import React, { useState } from 'react';
import { FaShieldAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function AutoMod({ config, updateConfig }) {
  const [automod, setAutomod] = useState(config?.automod || {});

  const handleToggle = async (field) => {
    const newAutomod = {
      ...automod,
      [field]: !automod[field]
    };
    setAutomod(newAutomod);
    await updateConfig({ automod: newAutomod });
  };

  const handlePunishmentChange = async (punishment) => {
    const newAutomod = {
      ...automod,
      punishment
    };
    setAutomod(newAutomod);
    await updateConfig({ automod: newAutomod });
  };

  const handleValueChange = async (field, value) => {
    const newAutomod = {
      ...automod,
      [field]: parseInt(value)
    };
    setAutomod(newAutomod);
    await updateConfig({ automod: newAutomod });
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaShieldAlt className="text-blue-500" />
          AutoMod System
        </h1>
        
        <button
          onClick={() => handleToggle('enabled')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            automod.enabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {automod.enabled ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
          {automod.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Status</div>
            <div className="text-2xl font-bold">
              {automod.enabled ? '✅ Active' : '❌ Inactive'}
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Punishment</div>
            <div className="text-2xl font-bold capitalize">{automod.punishment}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Max Warnings</div>
            <div className="text-2xl font-bold">{automod.maxWarnings}</div>
          </div>
        </div>
      </div>

      {/* Rules Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Active Rules</h2>
        
        <div className="space-y-4">
          <RuleToggle
            label="Anti-Spam"
            description="Automatically detect and remove spam messages"
            enabled={automod.antiSpam}
            onToggle={() => handleToggle('antiSpam')}
          />
          
          <RuleToggle
            label="Anti-Caps"
            description="Remove messages with excessive capital letters"
            enabled={automod.antiCaps}
            onToggle={() => handleToggle('antiCaps')}
          />
          
          <RuleToggle
            label="Anti-Links"
            description="Block unauthorized links and URLs"
            enabled={automod.antiLinks}
            onToggle={() => handleToggle('antiLinks')}
          />
          
          <RuleToggle
            label="Anti-Invites"
            description="Prevent Discord invite links"
            enabled={automod.antiInvites}
            onToggle={() => handleToggle('antiInvites')}
          />
          
          <RuleToggle
            label="Anti-Mention Spam"
            description="Block messages with too many mentions"
            enabled={automod.antiMentionSpam}
            onToggle={() => handleToggle('antiMentionSpam')}
          />
          
          <RuleToggle
            label="Anti-Bad Words"
            description="Filter inappropriate language"
            enabled={automod.antiBadWords}
            onToggle={() => handleToggle('antiBadWords')}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Spam Threshold</label>
            <input
              type="number"
              value={automod.spamThreshold || 5}
              onChange={(e) => handleValueChange('spamThreshold', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="1"
              max="10"
            />
            <p className="text-gray-400 text-sm mt-1">Messages within timeframe</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Spam Timeframe (ms)</label>
            <input
              type="number"
              value={automod.spamTimeframe || 5000}
              onChange={(e) => handleValueChange('spamTimeframe', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="1000"
              step="1000"
            />
            <p className="text-gray-400 text-sm mt-1">Detection window in milliseconds</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Caps Percentage</label>
            <input
              type="number"
              value={automod.capsPercentage || 70}
              onChange={(e) => handleValueChange('capsPercentage', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="1"
              max="100"
            />
            <p className="text-gray-400 text-sm mt-1">Max % of caps in a message</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Max Mentions</label>
            <input
              type="number"
              value={automod.maxMentions || 5}
              onChange={(e) => handleValueChange('maxMentions', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="1"
              max="20"
            />
            <p className="text-gray-400 text-sm mt-1">Maximum mentions per message</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Max Warnings</label>
            <input
              type="number"
              value={automod.maxWarnings || 3}
              onChange={(e) => handleValueChange('maxWarnings', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="1"
              max="10"
            />
            <p className="text-gray-400 text-sm mt-1">Warnings before punishment</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Mute Duration (ms)</label>
            <input
              type="number"
              value={automod.muteDuration || 600000}
              onChange={(e) => handleValueChange('muteDuration', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              min="60000"
              step="60000"
            />
            <p className="text-gray-400 text-sm mt-1">Timeout duration (if punishment is mute)</p>
          </div>
        </div>
      </div>

      {/* Punishment Selection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Punishment Type</h2>
        <p className="text-gray-400 mb-4">Choose what happens when a user reaches max warnings</p>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handlePunishmentChange('mute')}
            className={`p-4 rounded-lg border-2 transition ${
              automod.punishment === 'mute'
                ? 'border-blue-500 bg-blue-600/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">🔇</div>
            <div className="font-bold">Mute</div>
            <div className="text-sm text-gray-400">Timeout user</div>
          </button>
          
          <button
            onClick={() => handlePunishmentChange('kick')}
            className={`p-4 rounded-lg border-2 transition ${
              automod.punishment === 'kick'
                ? 'border-blue-500 bg-blue-600/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">👢</div>
            <div className="font-bold">Kick</div>
            <div className="text-sm text-gray-400">Kick from server</div>
          </button>
          
          <button
            onClick={() => handlePunishmentChange('ban')}
            className={`p-4 rounded-lg border-2 transition ${
              automod.punishment === 'ban'
                ? 'border-blue-500 bg-blue-600/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">🔨</div>
            <div className="font-bold">Ban</div>
            <div className="text-sm text-gray-400">Permanent ban</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleToggle({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`w-14 h-8 rounded-full transition ${
          enabled ? 'bg-green-500' : 'bg-gray-600'
        }`}
      >
        <div
          className={`w-6 h-6 bg-white rounded-full transform transition ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
