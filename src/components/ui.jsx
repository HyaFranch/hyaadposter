import { useState } from 'react'
import { X, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'

/* ─── Button ─────────────────────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, icon, style: sx, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 600, cursor: props.disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent', borderRadius: 'var(--r-sm)',
    transition: 'all 0.12s', flexShrink: 0, whiteSpace: 'nowrap',
  }
  const sizes = {
    sm: { fontSize: 11, padding: '4px 10px' },
    md: { fontSize: 13, padding: '7px 14px' },
    lg: { fontSize: 14, padding: '10px 20px' },
  }
  const variants = {
    primary: {
      background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)',
      opacity: props.disabled ? 0.5 : 1,
    },
    secondary: {
      background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--border-light)',
      opacity: props.disabled ? 0.5 : 1,
    },
    ghost: {
      background: 'transparent', color: 'var(--text-muted)', borderColor: 'transparent',
    },
    danger: {
      background: 'var(--danger-dim)', color: 'var(--danger)', borderColor: 'var(--danger)',
      opacity: props.disabled ? 0.5 : 1,
    },
    success: {
      background: 'var(--success-dim)', color: 'var(--success)', borderColor: 'var(--success)',
    },
  }

  return (
    <button {...props} style={{ ...base, ...sizes[size], ...variants[variant], ...sx }}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
export function Input({ label, hint, error, style: sx, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>}
      <input
        {...props}
        style={{
          background: 'var(--surface)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-light)'}`,
          borderRadius: 'var(--r-sm)',
          color: 'var(--text)',
          padding: '8px 12px',
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.12s',
          width: '100%',
          ...sx,
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)' }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-light)' }}
      />
      {(hint || error) && (
        <span style={{ fontSize: 11, color: error ? 'var(--danger)' : 'var(--text-dim)' }}>
          {error ?? hint}
        </span>
      )}
    </div>
  )
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({ children, variant = 'default', size = 'sm' }) {
  const colors = {
    default: { bg: 'var(--surface-3)', color: 'var(--text-muted)' },
    accent:  { bg: 'var(--accent-dim)', color: 'var(--accent)' },
    success: { bg: 'var(--success-dim)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    danger:  { bg: 'var(--danger-dim)', color: 'var(--danger)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: size === 'xs' ? '1px 6px' : '2px 8px',
      borderRadius: 99,
      fontSize: size === 'xs' ? 10 : 11,
      fontWeight: 600,
      letterSpacing: '0.02em',
      ...colors[variant],
    }}>
      {children}
    </span>
  )
}

/* ─── Card ───────────────────────────────────────────────────────────────── */
export function Card({ children, style: sx, padding = '20px', glow }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderRadius: 'var(--r-lg)',
      padding,
      boxShadow: glow ? 'var(--glow-accent)' : 'none',
      ...sx,
    }}>
      {children}
    </div>
  )
}

/* ─── Section header ─────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 16 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 99,
          background: checked ? 'var(--accent)' : 'var(--surface-3)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-light)'}`,
          position: 'relative', flexShrink: 0, marginTop: 1,
          transition: 'all 0.2s', cursor: 'pointer',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 17 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      {(label || description) && (
        <div>
          {label && <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>}
          {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
        </div>
      )}
    </label>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-fadein"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--r-xl)',
          width: '100%', maxWidth: width,
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Alert / Toast ──────────────────────────────────────────────────────── */
export function Alert({ variant = 'info', children }) {
  const map = {
    info:    { icon: Info,            color: 'var(--accent)',  bg: 'var(--accent-dim)' },
    success: { icon: CheckCircle2,    color: 'var(--success)', bg: 'var(--success-dim)' },
    warning: { icon: AlertTriangle,   color: 'var(--warning)', bg: 'var(--warning-dim)' },
    danger:  { icon: AlertTriangle,   color: 'var(--danger)',  bg: 'var(--danger-dim)' },
  }
  const { icon: Icon, color, bg } = map[variant]
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 14px', borderRadius: 'var(--r)',
      background: bg, border: `1px solid ${color}20`,
    }}>
      <Icon size={15} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12, color, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
      {Icon && (
        <div style={{
          width: 48, height: 48,
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color="var(--text-dim)" strokeWidth={1.5} />
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300 }}>{description}</div>}
      </div>
      {action}
    </div>
  )
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
export function Stat({ label, value, accent, icon: Icon }) {
  return (
    <Card padding="16px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {Icon && <Icon size={14} color="var(--text-dim)" />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
    </Card>
  )
}
