import { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, Zap, Clock, Hash, User, Layers, AlertTriangle } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { useSessionTimer } from '../hooks/useCountdown'
import { Button, Card, PageHeader, Stat, Alert, Badge, EmptyState } from '../components/ui'
import { unprotectCookie } from '../utils/config'

const TAG_LABELS = {
  any: 'Any', demand: 'Demand', rares: 'Rares', rap: 'RAP',
  wishlist: 'Wishlist', robux: 'Robux', upgrade: 'Upgrade',
  downgrade: 'Downgrade', adds: 'Adds', projecteds: 'Projecteds',
}

export default function Dashboard() {
  const { cfg, botStatus, startBot, stopBot, logs, activeAccount } = useApp()
  const [selectedProfile, setSelectedProfile] = useState('')
  const [sessionAds, setSessionAds] = useState(0)
  const elapsed = useSessionTimer(botStatus)

  const profiles = activeAccount?.profiles ?? {}
  const profileNames = Object.keys(profiles)

  // Sync selected profile with account's active profile
  useEffect(() => {
    const ap = activeAccount?.active_profile
    if (ap && profiles[ap]) setSelectedProfile(ap)
    else if (profileNames.length) setSelectedProfile(profileNames[0])
    else setSelectedProfile('')
  }, [cfg.active_account, activeAccount])

  // Count successful ads in session
  useEffect(() => {
    const count = logs.filter(l => l.level === 'ok' && l.text.includes('successfully')).length
    setSessionAds(count)
  }, [logs])

  const queue = profiles[selectedProfile]?.queue ?? []
  const hasCookie = !!unprotectCookie(activeAccount?.cookie_protected ?? '')
  const canStart = !!(activeAccount && selectedProfile && queue.length > 0 && hasCookie)
  const isRunning = botStatus === 'running' || botStatus === 'stopping'

  const handleStart = () => {
    if (!canStart || isRunning) return
    setSessionAds(0)
    startBot({ profileName: selectedProfile })
  }

  // Why can't we start?
  const startBlockReason = !activeAccount ? 'No account selected'
    : !hasCookie ? 'Account not verified — re-verify in Accounts'
    : !selectedProfile ? 'No profile selected'
    : queue.length === 0 ? 'Profile queue is empty — add trades first'
    : null

  const recentLogs = logs.slice(-5).reverse()

  return (
    <div className="animate-fadein">
      <PageHeader title="Dashboard" subtitle="Control the ad-posting bot" />

      {/* Warnings */}
      {startBlockReason && botStatus === 'idle' && (
        <Alert variant="warning" style={{ marginBottom: 16 }}>
          <AlertTriangle size={13} /> {startBlockReason}
        </Alert>
      )}
      {botStatus === 'expired' && (
        <Alert variant="danger" style={{ marginBottom: 16 }}>
          Cookie expired — go to <strong>Accounts</strong> and re-verify.
        </Alert>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <Stat
          label="Status"
          value={botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
          icon={Zap}
          accent={
            botStatus === 'running'  ? 'var(--success)' :
            botStatus === 'expired'  ? 'var(--danger)'  :
            botStatus === 'stopping' ? 'var(--warning)' : undefined
          }
        />
        <Stat label="Ads This Session" value={sessionAds} icon={Hash} accent="var(--accent)" />
        <Stat label="Session Time" value={isRunning ? elapsed : '—'} icon={Clock} />
        <Stat label="Active Account" value={activeAccount?.username ?? '—'} icon={User} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Control panel */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="var(--accent)" /> Bot Control
          </div>

          {/* Profile selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Trade Profile
            </label>
            {profileNames.length > 0 ? (
              <select
                value={selectedProfile}
                onChange={e => setSelectedProfile(e.target.value)}
                disabled={isRunning}
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)',
                  color: 'var(--text)', padding: '8px 12px', fontSize: 13,
                  fontFamily: 'inherit', cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.6 : 1, outline: 'none',
                }}
              >
                {profileNames.map(n => (
                  <option key={n} value={n}>{n} ({profiles[n]?.queue?.length ?? 0} trades)</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 0' }}>
                No profiles yet — create one in the Profiles tab.
              </div>
            )}
          </div>

          {/* Queue preview */}
          {queue.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Queue ({queue.length} trades)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {queue.slice(0, 3).map((trade, i) => (
                  <div key={trade.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: 'var(--surface-2)',
                    borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace', minWidth: 16 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trade.offer_items.map(it => it.name).join(', ')}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(trade.tags ?? []).map(t => (
                        <Badge key={t} variant="accent" size="xs">{TAG_LABELS[t] ?? t}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {queue.length > 3 && (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
                    +{queue.length - 3} more trades
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start / Stop buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              icon={<Play size={14} />}
              disabled={!canStart || isRunning}
              onClick={handleStart}
            >
              {botStatus === 'stopping' ? 'Stopping…' : 'Start Bot'}
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon={<Square size={14} />}
              disabled={botStatus === 'idle' || botStatus === 'expired' || botStatus === 'stopping'}
              onClick={stopBot}
            >
              Stop
            </Button>
          </div>

          {/* Disabled reason hint */}
          {startBlockReason && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, textAlign: 'center' }}>
              {startBlockReason}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} color="var(--accent)" /> Recent Activity
          </div>
          {recentLogs.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No activity yet"
              description="Start the bot to see live log entries here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLogs.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 10px', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                }}>
                  <span style={{
                    fontSize: 10, fontFamily: 'monospace',
                    color: 'var(--text-dim)', flexShrink: 0, marginTop: 1,
                  }}>{entry.time}</span>
                  <span style={{
                    fontSize: 12,
                    color: entry.level === 'ok'    ? 'var(--success)'
                         : entry.level === 'error' ? 'var(--danger)'
                         : entry.level === 'warn'  ? 'var(--warning)'
                         : 'var(--text-muted)',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}>
                    {entry.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
