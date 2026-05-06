import React from 'react';
export default function ReactionRoles({ guild, config, updateConfig }) {
  const panels = config?.reactionRoles || [];

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🎭 Reaction Roles</h2>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Allow members to self-assign roles</p>
      </div>

      <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: '#a78bfa', margin: '0 0 8px' }}>ℹ️ How to create panels</h3>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px' }}>1. Use <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>/reactionrole create title:"My Roles" type:button</code> in Discord</p>
          <p style={{ margin: '0 0 8px' }}>2. Add roles: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>/reactionrole add message_id:123 role:@Gaming emoji:🎮</code></p>
          <p style={{ margin: 0 }}>3. Types: <strong style={{ color: '#e2e8f0' }}>button</strong> (clickable buttons), <strong style={{ color: '#e2e8f0' }}>reaction</strong> (emoji reactions), <strong style={{ color: '#e2e8f0' }}>select</strong> (dropdown)</p>
        </div>
      </div>

      {panels.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {panels.map((panel, i) => (
            <div key={i} style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ color: '#e2e8f0', margin: 0 }}>{panel.title || 'Reaction Role Panel'}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    Type: {panel.type} | Channel: {panel.channelId} | {panel.roles?.length || 0} roles
                  </p>
                </div>
                <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>{panel.type?.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {panel.roles?.map((role, ri) => (
                  <span key={ri} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                    {role.emoji} {role.label || role.roleId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(51,65,85,0.5)', borderRadius: 12 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎭</div>
          <p style={{ color: '#94a3b8' }}>No reaction role panels yet. Create one using the Discord commands above!</p>
        </div>
      )}
    </div>
  );
}
