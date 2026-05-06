import React from 'react';

export default function Economy({ guild, config, updateConfig }) {
  const cfg = config?.economy || {};
  const update = (key, val) => updateConfig({ economy: { ...cfg, [key]: val } });

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🪙 Economy System</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Virtual currency and rewards</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="💰 Currency Settings">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Currency Name" value={cfg.currencyName || 'coins'} onChange={v => update('currencyName', v)} placeholder="coins" />
            <Input label="Currency Emoji" value={cfg.currencyEmoji || '🪙'} onChange={v => update('currencyEmoji', v)} placeholder="🪙" />
            <Input label="Daily Reward Amount" type="number" value={cfg.dailyAmount || 100} onChange={v => update('dailyAmount', +v)} />
          </div>
        </Card>

        <Card title="🎣 Fishing Rewards">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Min Coins per Fish" type="number" value={cfg.fishingMin || 10} onChange={v => update('fishingMin', +v)} />
            <Input label="Max Coins per Fish" type="number" value={cfg.fishingMax || 100} onChange={v => update('fishingMax', +v)} />
          </div>
        </Card>

        <Card title="📋 Available Commands">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['/daily', 'Claim daily coins (24h cooldown)'],
              ['/fish', 'Go fishing for coins (30s cooldown)'],
              ['/bank [user]', 'View wallet & bank balance'],
              ['/deposit <amount|all>', 'Deposit coins to bank'],
              ['/profile [user]', 'View full profile incl. economy'],
              ['/leaderboard economy', 'Economy leaderboard'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px' }}>
                <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{cmd}</code>
                <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '4px 0 0' }}>{desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: '20px 24px' }}><h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>{children}</div>;
}
function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
    </div>
  );
}
