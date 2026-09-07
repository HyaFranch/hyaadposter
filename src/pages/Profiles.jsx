import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Package, ArrowRight, Layers, Search, X } from 'lucide-react'
import { useApp } from '../hooks/useAppState'
import { useInventory } from '../hooks/useInventory'
import { Button, Card, PageHeader, Badge, Modal, Input, Alert, EmptyState } from '../components/ui'
import { fetchItemMarketData, fetchItemThumbnails } from '../utils/api'
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

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, minHeight: 480 }}>
        {/* Profile list */}
        <Card padding="10px">
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
                    border: `1px solid ${selected === name ? 'rgba(61,126,255,0.2)' : 'transparent'}`,
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
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected ? `${selected} — Queue` : 'Select a profile'}
              </div>
              {selected && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {queue.length} trade{queue.length !== 1 ? 's' : ''} · posted in order, then loops
              </div>}
            </div>
            {selected && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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

// ─── Trade Row ────────────────────────────────────────────────────────────────

function TradeRow({ trade, index, total, onEdit, onRemove, onMove }) {
  const totalRap = trade.offer_items.reduce((s, i) => s + (i.rap || 0), 0)
  const requestCount = trade.request_item_ids?.length ?? 0
  const [thumbs, setThumbs] = useState({})

  useEffect(() => {
    const ids = trade.offer_items.map(i => i.assetId).filter(Boolean)
    if (!ids.length) return
    fetchItemThumbnails(ids, '50x50').then(urls => setThumbs(urls))
  }, [trade.offer_items])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Index */}
      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', minWidth: 16, flexShrink: 0 }}>
        {index + 1}
      </span>

      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {trade.offer_items.slice(0, 4).map(item => (
          <div key={item.assetId} style={{
            width: 34, height: 34, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {thumbs[item.assetId]
              ? <img src={thumbs[item.assetId]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--border-light)' }} />
            }
          </div>
        ))}
        {trade.offer_items.length > 4 && (
          <div style={{
            width: 34, height: 34, borderRadius: 6, flexShrink: 0,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'var(--text-dim)', fontWeight: 600,
          }}>+{trade.offer_items.length - 4}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trade.offer_items.map(i => i.name).join(', ')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>RAP: {totalRap.toLocaleString('pt-BR')}</span>
          {requestCount > 0 && (
            <span style={{ color: 'var(--success)' }}>
              {requestCount} requested
            </span>
          )}
          {(trade.tags ?? []).map(t => (
            <span key={t} style={{ color: 'var(--accent)', fontSize: 10 }}>{TAG_LABELS[t] ?? t}</span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp size={13} /></Button>
        <Button variant="ghost" size="sm" onClick={() => onMove(1)} disabled={index === total - 1}><ChevronDown size={13} /></Button>
        <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={onEdit} />
        <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={onRemove} />
      </div>
    </div>
  )
}

// ─── New Profile Modal ────────────────────────────────────────────────────────

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

// ─── Trade Modal ──────────────────────────────────────────────────────────────

function TradeModal({ existing, username, onClose, onSave }) {
  const { items: inventory, loading: invLoading, error: invError } = useInventory(username)

  // Offer items
  const [selectedIds, setSelectedIds] = useState(new Set(existing?.offer_items?.map(i => i.assetId) ?? []))
  const [offerSearch, setOfferSearch] = useState('')

  // Tags
  const [tags, setTags] = useState(new Set(existing?.tags ?? []))

  // Request items
  const [requestIds, setRequestIds] = useState(new Set(existing?.request_item_ids ?? []))
  const [catalog, setCatalog] = useState({})
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [requestSearch, setRequestSearch] = useState('')
  const [requestResults, setRequestResults] = useState([])
  const [requestThumbs, setRequestThumbs] = useState({}) // id → imageUrl
  const searchDebounce = useRef(null)

  // Offer thumbnails
  const [thumbnails, setThumbnails] = useState({})

  const [tab, setTab] = useState('offer')

  // Fetch offer thumbnails when inventory loads
  useEffect(() => {
    if (!inventory.length) return
    fetchItemThumbnails(inventory.map(i => i.assetId), '110x110').then(urls => setThumbnails(urls))
  }, [inventory])

  // Load Rolimons catalog once
  useEffect(() => {
    setCatalogLoading(true)
    fetchItemMarketData().then(({ items }) => {
      setCatalog(items)
      setCatalogLoading(false)
    })
  }, [])

  // Debounced catalog search
  useEffect(() => {
    clearTimeout(searchDebounce.current)
    if (!requestSearch.trim()) { setRequestResults([]); return }
    searchDebounce.current = setTimeout(() => {
      const q = requestSearch.toLowerCase()
      const results = Object.entries(catalog)
        .filter(([, item]) =>
          item.name?.toLowerCase().includes(q) ||
          item.acronym?.toLowerCase().includes(q)
        )
        .slice(0, 40)
        .map(([id, item]) => ({ id: Number(id), ...item }))
      setRequestResults(results)
      // Fetch thumbnails for search results
      const ids = results.map(r => r.id)
      if (ids.length) fetchItemThumbnails(ids, '110x110').then(urls => setRequestThumbs(prev => ({ ...prev, ...urls })))
    }, 250)
    return () => clearTimeout(searchDebounce.current)
  }, [requestSearch, catalog])

  // Fetch thumbnails for already-selected request items when catalog loads
  useEffect(() => {
    if (!Object.keys(catalog).length || !requestIds.size) return
    fetchItemThumbnails([...requestIds], '110x110').then(urls => setRequestThumbs(prev => ({ ...prev, ...urls })))
  }, [catalog])

  const toggleOffer = id => setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const toggleTag = id => setTags(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id); return next }
    if (next.size >= MAX_TAGS) return prev
    next.add(id); return next
  })

  const toggleRequest = id => {
    setRequestIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    // Fetch thumb for this item if not already loaded
    if (!requestThumbs[id]) {
      fetchItemThumbnails([id], '110x110').then(urls => setRequestThumbs(prev => ({ ...prev, ...urls })))
    }
  }

  const removeRequest = id => setRequestIds(prev => {
    const next = new Set(prev); next.delete(id); return next
  })

  const handleSave = () => {
    if (!selectedIds.size) return alert('Select at least one item to offer')
    if (!tags.size) return alert('Select at least one tag')

    const offerItems = [...selectedIds].map(id => {
      const item = inventory.find(i => i.assetId === id)
      return { assetId: id, name: item?.name ?? `Item ${id}`, rap: item?.rap ?? 0, value: item?.value ?? -1, quantity: item?.quantity ?? 1 }
    })

    onSave({
      id: existing?.id,
      offer_items: offerItems,
      tags: [...tags],
      request_item_ids: [...requestIds],
    })
  }

  const filteredOffer = inventory.filter(i => i.name.toLowerCase().includes(offerSearch.toLowerCase()))

  // Selected request items resolved from catalog
  const requestedItems = [...requestIds].map(id => ({
    id,
    name: catalog[id]?.name ?? `Item ${id}`,
    acronym: catalog[id]?.acronym ?? '',
    rap: catalog[id]?.rap ?? 0,
    value: catalog[id]?.value ?? -1,
  }))

  const TAB_STYLE = active => ({
    padding: '6px 14px', borderRadius: 'var(--r-sm)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: 'none', fontFamily: 'inherit',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    transition: 'all 0.1s',
  })

  return (
    <Modal open onClose={onClose} title={existing ? 'Edit Trade' : 'New Trade'} width={700}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
          <button style={TAB_STYLE(tab === 'offer')} onClick={() => setTab('offer')}>
            Offer Items {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
          <button style={TAB_STYLE(tab === 'request')} onClick={() => setTab('request')}>
            Request Items {requestIds.size > 0 && `(${requestIds.size})`}
          </button>
          <button style={TAB_STYLE(tab === 'tags')} onClick={() => setTab('tags')}>
            Tags {tags.size > 0 && `(${tags.size})`}
          </button>
        </div>

        {/* ── Tab: Offer Items ── */}
        {tab === 'offer' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Pick items from your inventory to offer in this trade.
            </div>
            <Input
              placeholder="Search inventory…"
              value={offerSearch}
              onChange={e => setOfferSearch(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ height: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface-2)' }}>
              {invLoading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>Loading inventory…</div>}
              {invError && <div style={{ padding: 16, color: 'var(--danger)', fontSize: 13 }}>{invError}</div>}
              {!invLoading && !invError && filteredOffer.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>No items found</div>
              )}
              {!invLoading && !invError && filteredOffer.map(item => (
                <div
                  key={item.assetId}
                  onClick={() => toggleOffer(item.assetId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 14px', cursor: 'pointer',
                    background: selectedIds.has(item.assetId) ? 'var(--accent-dim)' : 'transparent',
                    borderLeft: `2px solid ${selectedIds.has(item.assetId) ? 'var(--accent)' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-sm)', flexShrink: 0,
                    background: 'var(--surface-3)',
                    border: `1px solid ${selectedIds.has(item.assetId) ? 'var(--accent)' : 'var(--border)'}`,
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.1s',
                  }}>
                    {thumbnails[item.assetId]
                      ? <img src={thumbnails[item.assetId]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--border-light)' }} />
                    }
                  </div>
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
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="8" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Request Items ── */}
        {tab === 'request' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Search the Rolimons catalog by name or acronym. Click to add/remove.
            </div>

            {/* Search box */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                placeholder="Search by name or acronym (e.g. Dom, VH, Pearlescent…)"
                style={{
                  width: '100%', background: 'var(--surface)',
                  border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)',
                  color: 'var(--text)', padding: '8px 12px 8px 30px',
                  fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>

            {/* Results grid */}
            <div style={{ height: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface-2)', padding: 10 }}>
              {catalogLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading Rolimons catalog…
                </div>
              )}
              {!catalogLoading && !requestSearch.trim() && requestedItems.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>
                  Type to search the Rolimons catalog
                </div>
              )}
              {!catalogLoading && requestSearch.trim() && requestResults.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>
                  No items found for "{requestSearch}"
                </div>
              )}

              {/* Show selected items first if no search */}
              {!catalogLoading && !requestSearch.trim() && requestedItems.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {requestedItems.map(item => (
                    <RequestItemCard
                      key={item.id}
                      item={item}
                      thumb={requestThumbs[item.id]}
                      selected={true}
                      onToggle={() => toggleRequest(item.id)}
                    />
                  ))}
                </div>
              )}

              {/* Search results grid */}
              {!catalogLoading && requestSearch.trim() && requestResults.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {requestResults.map(item => (
                    <RequestItemCard
                      key={item.id}
                      item={item}
                      thumb={requestThumbs[item.id]}
                      selected={requestIds.has(item.id)}
                      onToggle={() => toggleRequest(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected chips summary */}
            {requestedItems.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {requestedItems.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 99,
                    background: 'var(--success-dim)', border: '1px solid var(--success)',
                    fontSize: 11, color: 'var(--success)',
                  }}>
                    <span style={{ fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.acronym || item.name}
                    </span>
                    <button
                      onClick={() => removeRequest(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Tags ── */}
        {tab === 'tags' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Select up to {MAX_TAGS} tags — {tags.size}/{MAX_TAGS} selected.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500,
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
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {selectedIds.size} offering · {requestIds.size} requested · {tags.size} tag{tags.size !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} icon={<ArrowRight size={13} />}>Save Trade</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Request Item Card (grid tile) ───────────────────────────────────────────

function RequestItemCard({ item, thumb, selected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 6px', borderRadius: 'var(--r)',
        background: selected ? 'var(--success-dim)' : 'var(--surface-3)',
        border: `1px solid ${selected ? 'var(--success)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.1s', gap: 6, position: 'relative',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-light)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Checkmark badge */}
      {selected && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 14, height: 14, borderRadius: 4,
          background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="7" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 9 7"><path d="M1 3.5l2.5 2.5L8 1"/></svg>
        </div>
      )}

      {/* Thumbnail */}
      <div style={{
        width: 64, height: 64, borderRadius: 8, overflow: 'hidden',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {thumb
          ? <img src={thumb} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--border-light)' }} />
        }
      </div>

      {/* Name */}
      <div style={{
        fontSize: 11, fontWeight: 600, color: selected ? 'var(--success)' : 'var(--text)',
        textAlign: 'center', width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}>
        {item.name}
      </div>

      {/* RAP / Value */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
          RAP {(item.rap || 0).toLocaleString('pt-BR')}
        </div>
        {item.value > 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
            Val {item.value.toLocaleString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  )
}
