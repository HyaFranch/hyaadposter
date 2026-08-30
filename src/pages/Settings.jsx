import { useState } from 'react'
import { Webhook, Bell, Info, ExternalLink, Github, Send } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { Button, Card, PageHeader, Toggle, Input, Alert } from '../components/ui'
import { notifyWebhook } from '../utils/api'

export default function Settings() {
  const { cfg, setCfg } = useApp()
  const [webhookUrl, setWebhookUrl] = useState(cfg.webhook_url)
  const [saved, setSaved] = useState(false)
  const [testStatus, setTestStatus] = useState(null)  // null | 'sending' | 'ok' | 'error'

  const handleSave = () => {
    setCfg(prev => ({
      ...prev,
      webhook_url: webhookUrl.trim(),
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestWebhook = async () => {
    const url = webhookUrl.trim()
    if (!url.startsWith('https://discord.com/api/webhooks/')) {
      setTestStatus('error')
      setTimeout(() => setTestStatus(null), 3000)
      return
    }
    setTestStatus('sending')
    try {
      await notifyWebhook(url, {
        title: '✅ HyaAdPoster — Webhook test',
        color: 0x3d7eff,
        description: 'Your Discord webhook is working correctly. The bot will send notifications here.',
        footer: { text: 'HyaAdPoster v2.0' },
        timestamp: new Date().toISOString(),
      })
      setTestStatus('ok')
    } catch {
      setTestStatus('error')
    }
    setTimeout(() => setTestStatus(null), 3000)
  }

  return (
    <div className="animate-fadein">
      <PageHeader title="Settings" subtitle="Configure notifications and app behaviour" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>

        {/* Discord Webhook */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Webhook size={15} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Discord Notifications</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              checked={cfg.webhook_enabled}
              onChange={val => setCfg(prev => ({ ...prev, webhook_enabled: val }))}
              label="Enable Discord webhook"
              description="Sends a message to your Discord server when ads are posted or fail"
            />

            <Input
              label="Webhook URL"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/…"
              disabled={!cfg.webhook_enabled}
            />

            {cfg.webhook_enabled && !webhookUrl.trim().startsWith('https://discord.com/api/webhooks/') && (
              <Alert variant="warning">
                Paste a valid Discord webhook URL. Create one in your server settings under Integrations → Webhooks.
              </Alert>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleSave} variant={saved ? 'success' : 'primary'} size="sm">
                {saved ? '✓ Saved' : 'Save'}
              </Button>
              <Button
                onClick={handleTestWebhook}
                variant="secondary"
                size="sm"
                icon={<Send size={12} />}
                disabled={!cfg.webhook_enabled || !webhookUrl.trim() || testStatus === 'sending'}
                loading={testStatus === 'sending'}
              >
                {testStatus === 'ok' ? '✓ Sent!' : testStatus === 'error' ? '✕ Failed' : 'Test'}
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Info size={15} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>About HyaAdPoster</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div>
              <strong style={{ color: 'var(--text)' }}>HyaAdPoster v2.0</strong> — Automated trade ad poster for Rolimons.
            </div>
            <div>
              Automatically posts your Roblox limited trade ads every {15} minutes, rotating through
              your configured trade profiles. Supports multiple accounts, Discord notifications, and
              full queue management.
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--warning)' }}>⚠ Disclaimer:</span> Use at your own risk. This tool
              automates public Rolimons API calls. Rolimons may change their API at any time.
              Never share your cookie with anyone.
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Button
                variant="secondary" size="sm"
                icon={<Github size={13} />}
                onClick={() => window.open('https://github.com/your-org/HyaAdPoster', '_blank')}
              >
                GitHub
              </Button>
              <Button
                variant="secondary" size="sm"
                icon={<ExternalLink size={13} />}
                onClick={() => window.open('https://www.rolimons.com', '_blank')}
              >
                Rolimons
              </Button>
            </div>
          </div>
        </Card>

        {/* Timing info */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Bell size={15} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Timing & Limits</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Post interval',   value: '15 minutes' },
              { label: 'Max tags per ad', value: '4' },
              { label: 'Max offer items', value: '4 (Rolimons limit)' },
              { label: 'Daily ad limit',  value: 'Set by Rolimons (check their site)' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
