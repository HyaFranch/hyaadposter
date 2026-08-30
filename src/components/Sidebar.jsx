import { LayoutDashboard, Layers, Users, Settings, ScrollText, Github } from 'lucide-react'
import { useApp } from '../hooks/useAppState'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'profiles',  label: 'Profiles',   icon: Layers },
  { id: 'accounts',  label: 'Accounts',   icon: Users },
  { id: 'logs',      label: 'Live Log',   icon: ScrollText },
  { id: 'settings',  label: 'Settings',   icon: Settings },
]

export default function Sidebar({ current, onNavigate }) {
  const { cfg, botStatus } = useApp()
  const activeAcc = cfg.accounts[cfg.active_account]

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 0',
    }}>
      {/* Account badge */}
      {activeAcc && (
        <div style={{
          margin: '0 10px 16px',
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: 'var(--r)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3, fontWeight: 500 }}>ACTIVE ACCOUNT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeAcc.username}
          </div>
          {activeAcc.active_profile && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeAcc.active_profile}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                margin: '1px 0',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
                borderRadius: active ? '0 var(--r-sm) var(--r-sm) 0' : 0,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {id === 'logs' && botStatus === 'running' && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--success)',
                  boxShadow: '0 0 6px var(--success)',
                  animation: 'pulse-dot 2s infinite',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <a
          href="https://github.com/your-org/HyaAdPoster"
          target="_blank"
          rel="noreferrer"
          onClick={e => {
            e.preventDefault()
            window.electronAPI?.shell?.openExternal('https://github.com/your-org/HyaAdPoster')
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-dim)', fontSize: 12,
            textDecoration: 'none',
          }}
        >
          <Github size={13} />
          Open Source on GitHub
        </a>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>MIT License</div>
      </div>
    </aside>
  )
}
