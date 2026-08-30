import { useState } from 'react'
import { Plus, User, Trash2, RefreshCw, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { Button, Card, PageHeader, Badge, Modal, Input, Alert, EmptyState } from '../components/ui'
import { extractCookieValue, unprotectCookie } from '../utils/config'

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
        Your cookie is stored locally and only used to authenticate with Rolimons. Never share it with anyone.
      </Alert>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No accounts added"
            description="Add your Roblox account to get started. You'll need your Rolimons verification cookie."
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
              <Card key={id} style={{ border: isActive ? '1px solid var(--accent)30' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar placeholder */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--r)',
                    background: 'linear-gradient(135deg, var(--accent-dim), var(--surface-3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={18} color="var(--accent)" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{acc.username}</span>
                      {isActive && <Badge variant="accent">Active</Badge>}
                      <Badge variant={hasCookie ? 'success' : 'danger'}>
                        {hasCookie ? '✓ Verified' : '✗ No Cookie'}
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
                    <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />}
                      onClick={() => setReverifying({ id, username: acc.username })}>
                      Re-verify
                    </Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={12} />}
                      onClick={() => { if (confirm(`Remove account "${acc.username}"?`)) removeAccount(id) }}>
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add account modal */}
      <AddAccountModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={({ username, cookiePlain }) => {
          addAccount({ username, cookiePlain })
          setShowAdd(false)
        }}
      />

      {/* Re-verify modal */}
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

function AddAccountModal({ open, onClose, onSave, initialUsername = '', isReverify = false }) {
  const [username, setUsername] = useState(initialUsername)
  const [cookiePasted, setCookiePasted] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!isReverify && !username.trim()) return setError('Username is required')
    const cookiePlain = extractCookieValue(cookiePasted.trim())
    if (!cookiePlain) return setError('Paste a valid Rolimons cookie')
    onSave({ username: username.trim(), cookiePlain })
    setSaved(true)
  }

  return (
    <Modal open={open} onClose={onClose} title={isReverify ? 'Re-verify Account' : 'Add Account'} width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Instructions */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: '14px 16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="var(--accent)" /> How to get your cookie
          </div>
          <ol style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
            <li>Open <a href="https://www.rolimons.com/verify" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>rolimons.com/verify</a> and log in</li>
            <li>Open DevTools → Application → Cookies → rolimons.com</li>
            <li>Copy the value of <code style={{ background: 'var(--surface-3)', padding: '1px 4px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>_RoliVerification</code></li>
            <li>Paste it below</li>
          </ol>
        </div>

        {!isReverify && (
          <Input
            label="Roblox username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="YourUsername"
          />
        )}

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            _RoliVerification cookie value
          </label>
          <textarea
            value={cookiePasted}
            onChange={e => setCookiePasted(e.target.value)}
            placeholder="Paste cookie value here…"
            style={{
              width: '100%', height: 80,
              background: 'var(--surface)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border-light)'}`,
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)', padding: '10px 12px',
              fontSize: 12, fontFamily: 'var(--font-mono)',
              resize: 'vertical', outline: 'none',
            }}
          />
          {error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
        </div>

        {saved && (
          <Alert variant="success">
            <CheckCircle2 size={13} /> Cookie saved successfully.
          </Alert>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={<ShieldCheck size={13} />} onClick={handleSave}>
            {isReverify ? 'Update Cookie' : 'Save Account'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
