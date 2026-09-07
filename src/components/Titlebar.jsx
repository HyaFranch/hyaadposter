import { Minus, Square, X } from 'lucide-react'
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

const ICON_B64 = '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'

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
        <img
          src={`data:image/png;base64,${ICON_B64}`}
          alt="HyaAdPoster"
          style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
        />
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
