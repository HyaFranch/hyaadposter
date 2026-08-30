import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Package, ArrowRight, Layers } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { useInventory } from '../hooks/useInventory'
import { Button, Card, PageHeader, Badge, Modal, Input, Alert, EmptyState } from '../components/ui'
import { unprotectCookie } from '../utils/config'

const TAG_OPTIONS = [
  { id: 'any',        label: 'Any' },
  { id: 'demand',     label: 'Demand' },
  { id: 'rares',      label: 'Rares' },
  { id: 'rap',        label: 'RAP / Value' },
  { id: 'wishlist',   label: 'Wishlist' },
  { id: 'robux',      label: 'Robux' },
  { id: 'upgrade',    label: 'Upgrade' },
  { id: 'downgrade',  label: 'Downgrade' },
  { id: 'adds',       label: 'Adds' },
  { id: 'projecteds', label: 'Projecteds' },
]
const TAG_LABELS = Object.fromEntries(TAG_OPTIONS.map(t => [t.id, t.label]))
const MAX_TAGS = 4

export default function Profiles() {
  const { cfg, activeAccount, createProfile, renameProfile, deleteProfile, setActiveProfile,
          addTrade, updateTrade, removeTrade, moveTrade } = useApp()

  const profiles = activeAccount?.profiles ?? {}
  const [selected, setSelected] = useState('')
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [renamingProfile, setRenamingProfile] = useState(null)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState(null)

  useEffect(() => {
    const ap = activeAccount?.active_profile
    if (ap && profiles[ap]) setSelected(ap)
    else { const first = Object.keys(profiles)[0]; setSelected(first ?? '') }
  }, [cfg.active_account])

  const queue = profiles[selected]?.queue ?? []

  if (!activeAccount) return (
    <div className="animate-fadein">
      <PageHeader title="Profiles" subtitle="Manage trade profiles and queues" />
      <Alert variant="warning">No account selected. Add an account first.</Alert>
    </div>
  )

  return (
    <div className="animate-fadein">
      <PageHeader
        title="Profiles"
        subtitle="Organize your trades into profiles and build posting queues"
        action={
          <Button icon={<Plus size={14} />} onClick={() => setShowNewProfile(true)}>
            New Profile
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, minHeight: 480 }}>
        {/* Profile list */}
        <Card padding="12px">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', marginBottom: 8 }}>
            Profiles
          </div>
          {Object.keys(profiles).length === 0 ? (
            <div style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
              No profiles yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.keys(profiles).map(name => (
                <div
                  key={name}
                  onClick={() => { setSelected(name); setActiveProfile(name) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 'var(--r-sm)',
                    background: selected === name ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${selected === name ? 'var(--accent)20' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}
                >
                  <Layers size={13} color={selected === name ? 'var(--accent)' : 'var(--text-dim)'} />
                  <span style={{ flex: 1, fontSize: 13, color: selected === name ? 'var(--accent)' : 'var(--text)', fontWeight: selected === name ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {profiles[name]?.queue?.length ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Queue */}
        <Card padding="0">
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {selected ? `${selected} — Queue` : 'Select a profile'}
              </div>
              {selected && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {queue.length} trade{queue.length !== 1 ? 's' : ''} · posted in order, then loops
              </div>}
            </div>
            {selected && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => setRenamingProfile(selected)}>
                  Rename
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => {
                  if (confirm(`Delete profile "${selected}"?`)) deleteProfile(selected)
                }}>
                  Delete
                </Button>
                <Button size="sm" icon={<Plus size={12} />} onClick={() => { setEditingTrade(null); setShowTradeModal(true) }}>
                  Add Trade
                </Button>
              </div>
            )}
          </div>

          {!selected ? (
            <EmptyState icon={Layers} title="No profile selected" description="Select or create a profile to manage its queue." />
          ) : queue.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Queue is empty"
              description="Add trades to this profile. The bot will post them in order, then loop."
              action={<Button icon={<Plus size={14} />} onClick={() => setShowTradeModal(true)}>Add First Trade</Button>}
            />
          ) : (
            <div>
              {queue.map((trade, i) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  index={i}
                  total={queue.length}
                  onEdit={() => { setEditingTrade(trade); setShowTradeModal(true) }}
                  onRemove={() => removeTrade(selected, trade.id)}
                  onMove={dir => moveTrade(selected, trade.id, dir)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <NewProfileModal
        open={showNewProfile}
        onClose={() => setShowNewProfile(false)}
        onSave={name => { createProfile(name); setSelected(name); setShowNewProfile(false) }}
        existingNames={Object.keys(profiles)}
      />

      {renamingProfile && (
        <NewProfileModal
          open
          initial={renamingProfile}
          onClose={() => setRenamingProfile(null)}
          onSave={name => { renameProfile(renamingProfile, name); setSelected(name); setRenamingProfile(null) }}
          existingNames={Object.keys(profiles).filter(n => n !== renamingProfile)}
        />
      )}

      {showTradeModal && selected && (
        <TradeModal
          profile={selected}
          existing={editingTrade}
          username={activeAccount.username}
          cookie={unprotectCookie(activeAccount.cookie_protected)}
          onClose={() => { setShowTradeModal(false); setEditingTrade(null) }}
          onSave={trade => {
            if (editingTrade) updateTrade(selected, trade)
            else addTrade(selected, { ...trade, id: crypto.randomUUID() })
            setShowTradeModal(false); setEditingTrade(null)
          }}
        />
      )}
    </div>
  )
}

function TradeRow({ trade, index, total, onEdit, onRemove, onMove }) {
  const names = trade.offer_items.map(i => i.name).join(', ')
  const totalRap = trade.offer_items.reduce((s, i) => s + (i.rap || 0), 0)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px', borderBottom: '1px solid var(--border)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', minWidth: 20 }}>
        {index + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {names}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          RAP: {totalRap.toLocaleString('pt-BR')}
          {trade.request_item_ids?.length > 0 && ` · ${trade.request_item_ids.length} specific requests`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {(trade.tags ?? []).map(t => <Badge key={t} variant="accent" size="xs">{TAG_LABELS[t] ?? t}</Badge>)}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <Button variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp size={13} /></Button>
        <Button variant="ghost" size="sm" onClick={() => onMove(1)} disabled={index === total - 1}><ChevronDown size={13} /></Button>
        <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={onEdit} />
        <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={onRemove} />
      </div>
    </div>
  )
}

function NewProfileModal({ open, onClose, onSave, existingNames = [], initial = '' }) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')
  useEffect(() => { setName(initial); setError('') }, [open, initial])

  const handleSave = () => {
    const n = name.trim()
    if (!n) return setError('Name is required')
    if (existingNames.includes(n)) return setError('A profile with this name already exists')
    onSave(n)
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Rename Profile' : 'New Profile'} width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Profile name" value={name} onChange={e => setName(e.target.value)} error={error} autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function TradeModal({ profile, existing, username, cookie, onClose, onSave }) {
  const { items: inventory, loading, error } = useInventory(username)
  const [selectedIds, setSelectedIds] = useState(new Set(existing?.offer_items?.map(i => i.assetId) ?? []))
  const [tags, setTags] = useState(new Set(existing?.tags ?? []))
  const [search, setSearch] = useState('')

  const toggleItem = id => setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const toggleTag = id => setTags(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id); return next }
    if (next.size >= MAX_TAGS) return prev
    next.add(id); return next
  })

  const handleSave = () => {
    if (!selectedIds.size) return alert('Select at least one item to offer')
    if (!tags.size) return alert('Select at least one tag')

    const offerItems = [...selectedIds].map(id => {
      const item = inventory.find(i => i.assetId === id)
      return { assetId: id, name: item?.name ?? `Item ${id}`, rap: item?.rap ?? 0, value: item?.value ?? -1, quantity: item?.quantity ?? 1 }
    })

    onSave({ id: existing?.id, offer_items: offerItems, tags: [...tags], request_item_ids: existing?.request_item_ids ?? [] })
  }

  const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal open onClose={onClose} title={existing ? 'Edit Trade' : 'New Trade'} width={640}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Item picker */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Offer Items ({selectedIds.size} selected)
          </div>
          <Input
            placeholder="Search inventory…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div style={{ height: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface-2)' }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading inventory…
              </div>
            )}
            {error && <div style={{ padding: 16, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            {!loading && !error && filtered.map(item => (
              <div
                key={item.assetId}
                onClick={() => toggleItem(item.assetId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', cursor: 'pointer',
                  background: selectedIds.has(item.assetId) ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: `2px solid ${selectedIds.has(item.assetId) ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    RAP: {item.rap.toLocaleString('pt-BR')}
                    {item.value > 0 && ` · Value: ${item.value.toLocaleString('pt-BR')}`}
                    {item.quantity > 1 && ` · x${item.quantity}`}
                  </div>
                </div>
                {selectedIds.has(item.assetId) && (
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="8" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Tags (up to {MAX_TAGS}) <span style={{ color: 'var(--text-dim)' }}>— {tags.size}/{MAX_TAGS} selected</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{
                  padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${tags.has(tag.id) ? 'var(--accent)' : 'var(--border-light)'}`,
                  background: tags.has(tag.id) ? 'var(--accent-dim)' : 'var(--surface-2)',
                  color: tags.has(tag.id) ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: (!tags.has(tag.id) && tags.size >= MAX_TAGS) ? 'not-allowed' : 'pointer',
                  opacity: (!tags.has(tag.id) && tags.size >= MAX_TAGS) ? 0.4 : 1,
                  transition: 'all 0.1s', fontFamily: 'inherit',
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} icon={<ArrowRight size={13} />}>Save Trade</Button>
        </div>
      </div>
    </Modal>
  )
}
