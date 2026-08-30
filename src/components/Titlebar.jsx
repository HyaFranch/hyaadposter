import { Minus, Square, X, Zap } from 'lucide-react'
import { useApp } from '../hooks/useAppState'

const STATUS_COLOR = {
  idle:     'var(--text-dim)',
  running:  'var(--success)',
  stopping: 'var(--warning)',
  expired:  'var(--danger)',
}

const STATUS_LABEL = {
  idle:     'Idle',
  running:  'Running',
  stopping: 'Stopping…',
  expired:  'Cookie expired',
}

export default function Titlebar() {
  const { botStatus } = useApp()
  const api = window.electronAPI

  return (
    <div style={{
      height: 40,
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border)',
      WebkitAppRegion: 'drag',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, minWidth: 200 }}>
        <div style={{
          width: 22, height: 22,
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          HyaAdPoster
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.02em' }}>v2.0</span>
      </div>

      {/* Draggable center */}
      <div style={{ flex: 1 }} />

      {/* Status pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px',
        background: 'var(--surface)',
        borderRadius: 99,
        border: '1px solid var(--border)',
      }}>
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: STATUS_COLOR[botStatus] ?? 'var(--text-dim)',
          boxShadow: botStatus === 'running' ? '0 0 8px var(--success)' : 'none',
          animation: botStatus === 'running' ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          {STATUS_LABEL[botStatus] ?? botStatus}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Window controls */}
      {api && (
        <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
          {[
            { icon: <Minus size={12} />, action: 'minimize', color: '#fbbf24' },
            { icon: <Square size={11} />, action: 'maximize', color: 'var(--accent)' },
            { icon: <X size={12} />,    action: 'close',    color: '#f0546e' },
          ].map(({ icon, action, color }) => (
            <button
              key={action}
              onClick={() => api.window[action]()}
              style={{
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                color: 'var(--text-dim)', cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = action === 'close' ? 'var(--danger-dim)' : 'var(--surface)'; e.currentTarget.style.color = color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
