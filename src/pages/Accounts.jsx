import { useState } from 'react'
import { Plus, User, Trash2, RefreshCw, LogIn, Users, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { Button, Card, PageHeader, Badge, Modal, Input, Alert, EmptyState } from '../components/ui'
import { extractCookieValue, unprotectCookie } from '../utils/config'

const isElectron = !!window.electronAPI?.auth

export default function Accounts() {
  const { cfg, addAccount, updateAccountCookie, removeAccount, setActiveAccount } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [reverifying, setReverifying] = useState(null)

  const accounts = Object.entries(cfg.accounts)

  return (
    <div className="animate-fadein">
      <PageHeader
        title="Accounts"
        subtitle="Manage your Roblox/Rolimons accounts"
        action={<Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Account</Button>}
      />

      <Alert variant="info" style={{ marginBottom: 20 }}>
        Your cookie is stored locally and never leaves your machine. It is only used to post ads on Rolimons.
      </Alert>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No accounts added"
            description={isElectron
              ? 'Click "Add Account", then sign in to Rolimons — the app captures the cookie automatically.'
              : 'Add your Roblox account to get started.'}
            action={<Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Account</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map(([id, acc]) => {
            const isActive = cfg.active_account === id
            const hasCookie = !!unprotectCookie(acc.cookie_protected)
            const profileCount = Object.keys(acc.profiles ?? {}).length

            return (
              <Card key={id} style={{ border: isActive ? '1px solid rgba(61,126,255,0.3)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--r)',
                    background: 'linear-gradient(135deg, var(--accent-dim), var(--surface-3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={18} color="var(--accent)" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{acc.username}</span>
                      {isActive && <Badge variant="accent">Active</Badge>}
                      <Badge variant={hasCookie ? 'success' : 'danger'}>
                        {hasCookie ? '✓ Verified' : '✗ Not verified'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {profileCount} profile{profileCount !== 1 ? 's' : ''}
                      {acc.active_profile && ` · Active: ${acc.active_profile}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isActive && (
                      <Button variant="secondary" size="sm" onClick={() => setActiveAccount(id)}>
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="secondary" size="sm"
                      icon={<RefreshCw size={12} />}
                      onClick={() => setReverifying({ id, username: acc.username })}
                    >
                      Re-verify
                    </Button>
                    <Button
                      variant="danger" size="sm"
                      icon={<Trash2 size={12} />}
                      onClick={() => { if (confirm(`Remove account "${acc.username}"?`)) removeAccount(id) }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AddAccountModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={({ username, cookiePlain }) => {
          addAccount({ username, cookiePlain })
          setShowAdd(false)
        }}
      />

      {reverifying && (
        <AddAccountModal
          open
          initialUsername={reverifying.username}
          isReverify
          onClose={() => setReverifying(null)}
          onSave={({ cookiePlain }) => {
            updateAccountCookie(reverifying.id, cookiePlain)
            setReverifying(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Add / Re-verify Modal ────────────────────────────────────────────────────

function AddAccountModal({ open, onClose, onSave, initialUsername = '', isReverify = false }) {
  const [username, setUsername] = useState(initialUsername)
  const [cookiePasted, setCookiePasted] = useState('')
  const [error, setError] = useState('')
  const [loginStatus, setLoginStatus] = useState('idle') // idle | waiting | success | error

  const handleLoginWindow = async () => {
    if (!window.electronAPI?.auth) return
    setLoginStatus('waiting')
    setError('')
    try {
      const result = await window.electronAPI.auth.openLoginWindow(isReverify ? initialUsername : '')
      if (!result.ok || !result.cookie) {
        setLoginStatus('idle')
        return // user just closed the window
      }
      // Auto-fill username if the page returned it and we don't have one yet
      if (result.username && !username.trim()) setUsername(result.username)
      setLoginStatus('success')
      // Save immediately with the captured cookie
      const finalUsername = result.username || username.trim()
      if (!isReverify && !finalUsername) {
        // Username field still empty — let the user fill it then save manually
        setCookiePasted(result.cookie)
        setLoginStatus('idle')
        setError('Cookie captured! Now enter your Roblox username and click Save.')
        return
      }
      onSave({ username: finalUsername || initialUsername, cookiePlain: result.cookie })
    } catch (e) {
      setLoginStatus('error')
      setError(`Login window error: ${e.message}`)
    }
  }

  const handleManualSave = () => {
    if (!isReverify && !username.trim()) return setError('Enter your Roblox username')
    const cookiePlain = extractCookieValue(cookiePasted.trim())
    if (!cookiePlain) return setError('Paste a valid _RoliVerification cookie value')
    onSave({ username: username.trim() || initialUsername, cookiePlain })
  }

  return (
    <Modal open={open} onClose={onClose} title={isReverify ? 'Re-verify Account' : 'Add Account'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Electron: one-click login ── */}
        {isElectron && (
          <div style={{
            padding: '18px 20px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(61,126,255,0.3)',
            borderRadius: 'var(--r)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogIn size={16} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                Sign in automatically
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Opens an isolated Rolimons login window. Sign in with your Roblox account and the cookie is captured automatically — no copy-pasting needed.
            </div>
            <Button
              icon={loginStatus === 'waiting' ? undefined : <LogIn size={13} />}
              loading={loginStatus === 'waiting'}
              variant={loginStatus === 'success' ? 'success' : 'primary'}
              onClick={handleLoginWindow}
              disabled={loginStatus === 'waiting'}
            >
              {loginStatus === 'waiting' ? 'Waiting for login…'
               : loginStatus === 'success' ? '✓ Logged in!'
               : 'Open Rolimons Login'}
            </Button>
            {loginStatus === 'waiting' && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Complete the login in the popup window. It will close automatically once the cookie is captured.
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{isElectron ? 'or paste manually' : 'Enter your cookie'}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Manual: username + paste ── */}
        {!isReverify && (
          <Input
            label="Roblox username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="YourUsername"
          />
        )}

        {/* Instructions for non-Electron / manual */}
        {!isElectron && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '12px 14px', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={13} color="var(--accent)" /> How to get your cookie
            </div>
            <ol style={{ paddingLeft: 16, margin: 0 }}>
              <li>Go to <a href="https://www.rolimons.com/verify" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>rolimons.com/verify</a> and log in</li>
              <li>Open DevTools (F12) → Application → Cookies → rolimons.com</li>
              <li>Copy the value of <code style={{ background: 'var(--surface-3)', padding: '1px 4px', borderRadius: 3 }}>_RoliVerification</code></li>
            </ol>
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            _RoliVerification cookie value
          </label>
          <textarea
            value={cookiePasted}
            onChange={e => { setCookiePasted(e.target.value); setError('') }}
            placeholder="Paste cookie value here…"
            style={{
              width: '100%', height: 72,
              background: 'var(--surface)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border-light)'}`,
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)', padding: '8px 12px',
              fontSize: 12, fontFamily: 'var(--font-mono)',
              resize: 'none', outline: 'none',
            }}
          />
        </div>

        {error && (
          <Alert variant={error.includes('captured') ? 'success' : 'danger'}>
            <AlertTriangle size={13} /> {error}
          </Alert>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={<ShieldCheck size={13} />} onClick={handleManualSave} disabled={!cookiePasted.trim()}>
            {isReverify ? 'Update Cookie' : 'Save Account'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
