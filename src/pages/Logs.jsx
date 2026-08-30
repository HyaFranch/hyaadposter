import { useEffect, useRef } from 'react'
import { Trash2, ScrollText, Download } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { Button, PageHeader, Card } from '../components/ui'

const LEVEL_STYLE = {
  ok:    { color: 'var(--success)',  prefix: '✓' },
  warn:  { color: 'var(--warning)', prefix: '⚠' },
  error: { color: 'var(--danger)',  prefix: '✕' },
  info:  { color: 'var(--text-muted)', prefix: '·' },
}

export default function Logs() {
  const { logs, clearLogs, botStatus } = useApp()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const downloadLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.text}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'hyaadposter-log.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Live Log"
        subtitle={`${logs.length} entries · ${botStatus === 'running' ? '● Recording' : 'Bot idle'}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={downloadLogs} disabled={!logs.length}>
              Export
            </Button>
            <Button variant="secondary" size="sm" icon={<Trash2 size={13} />} onClick={clearLogs} disabled={!logs.length}>
              Clear
            </Button>
          </div>
        }
      />

      <Card padding="0" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {logs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', gap: 10 }}>
            <ScrollText size={28} strokeWidth={1.2} />
            <div style={{ fontSize: 13 }}>No log entries yet — start the bot to see output here.</div>
          </div>
        ) : (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 0',
            fontFamily: 'var(--font-mono)', fontSize: 12,
          }}>
            {logs.map(entry => {
              const style = LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.info
              return (
                <div
                  key={entry.id}
                  className="selectable"
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '4px 20px',
                    background: entry.level === 'error' ? 'var(--danger-dim)20' : entry.level === 'ok' ? 'var(--success-dim)10' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = entry.level === 'error' ? 'var(--danger-dim)20' : entry.level === 'ok' ? 'var(--success-dim)10' : 'transparent'
                  }}
                >
                  <span style={{ color: 'var(--text-dim)', flexShrink: 0, minWidth: 70 }}>{entry.time}</span>
                  <span style={{ color: style.color, flexShrink: 0, minWidth: 12 }}>{style.prefix}</span>
                  <span style={{ color: entry.level === 'info' ? 'var(--text-muted)' : style.color, lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {entry.text}
                  </span>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Status bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-elevated)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: botStatus === 'running' ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: botStatus === 'running' ? '0 0 8px var(--success)' : 'none',
            animation: botStatus === 'running' ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {botStatus === 'running' ? 'Bot active — receiving output' : 'Bot idle'} · {logs.length} lines
          </span>
        </div>
      </Card>
    </div>
  )
}
