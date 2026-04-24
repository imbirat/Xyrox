import React, { useState } from 'react';

export default function Settings({ config, updateConfig }) {
  const [settings, setSettings] = useState({
    commandMode: config?.commandMode || 'slash',
    prefix: config?.prefix || '?'
  });
  
  const handleSave = async () => {
    await updateConfig(settings);
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Server Settings</h1>
      
      {/* Command Mode */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Command System</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Command Mode</label>
            <select
              value={settings.commandMode}
              onChange={(e) => setSettings({ ...settings, commandMode: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
            >
              <option value="slash">Slash Commands Only (/)</option>
              <option value="prefix">Prefix Commands Only</option>
              <option value="both">Both (Hybrid Mode)</option>
            </select>
            <p className="text-gray-400 text-sm mt-1">
              Choose how users can execute commands in your server
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Command Prefix</label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
              maxLength="5"
            />
            <p className="text-gray-400 text-sm mt-1">
              Prefix for text commands (only used if prefix mode is enabled)
            </p>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
