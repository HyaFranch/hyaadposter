const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
const COOKIE_NAME = '_RoliVerification'
const POST_INTERVAL_MS = 15 * 60 * 1000

export class RobloxAPIError extends Error {}
export class CookieExpiredError extends Error {}

// ─── Roblox ──────────────────────────────────────────────────────────────────

export async function resolveUserId(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
  })
  if (!res.ok) throw new RobloxAPIError(`HTTP ${res.status}`)
  const { data } = await res.json()
  if (!data?.length) throw new RobloxAPIError(`User '${username}' not found`)
  return { id: data[0].id, name: data[0].name }
}

export async function getUserAvatarUrl(userId) {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
      { headers: { 'User-Agent': UA } }
    )
    const { data } = await res.json()
    return data?.[0]?.imageUrl ?? ''
  } catch {
    return ''
  }
}

export async function getInventory(userId) {
  const items = []
  let cursor = ''
  while (true) {
    const url = `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${cursor}`
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.status === 403) throw new RobloxAPIError('Inventory is private — make it public in Roblox settings')
    if (!res.ok) throw new RobloxAPIError(`HTTP ${res.status}`)
    const body = await res.json()
    items.push(...(body.data ?? []))
    cursor = body.nextPageCursor
    if (!cursor) break
  }
  return items
}

export async function fetchItemThumbnails(assetIds, size = '50x50') {
  const urls = {}
  const ids = [...new Set(assetIds.filter(Boolean))]
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    try {
      const res = await fetch(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${chunk.join(',')}&size=${size}&format=Png&isCircular=false`,
        { headers: { 'User-Agent': UA } }
      )
      const { data } = await res.json()
      for (const entry of data ?? []) {
        if (entry.imageUrl && entry.targetId != null) urls[entry.targetId] = entry.imageUrl
      }
    } catch { /* continue */ }
  }
  return urls
}

// ─── Rolimons ────────────────────────────────────────────────────────────────

const ITEM_CACHE_KEY = 'hyaadposter_itemcache_v1'
const CACHE_TTL_MS = 30 * 60 * 1000  // 30 min

export async function fetchItemMarketData() {
  try {
    const raw = localStorage.getItem(ITEM_CACHE_KEY)
    if (raw) {
      const { fetchedAt, items } = JSON.parse(raw)
      if (Date.now() - fetchedAt < CACHE_TTL_MS) return { items, fresh: false }
    }
  } catch { /* ignore */ }

  const endpoints = [
    { url: 'https://api.rolimons.com/items/v2/itemdetails', rapI: 2, valI: 4, demI: 5 },
    { url: 'https://www.rolimons.com/itemapi/itemdetails',  rapI: 2, valI: 3, demI: 5 },
  ]

  for (const { url, rapI, valI, demI } of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) continue
      const body = await res.json()
      const raw = body.items ?? {}
      if (!Object.keys(raw).length) continue
      const items = {}
      for (const [id, f] of Object.entries(raw)) {
        items[Number(id)] = {
          name:    f[0] ?? '',
          acronym: f[1] ?? '',
          rap:     f[rapI] ?? 0,
          value:   f[valI] ?? -1,
          demand:  f[demI] ?? -1,
        }
      }
      localStorage.setItem(ITEM_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), items }))
      return { items, fresh: true }
    } catch { /* try next */ }
  }

  return { items: {}, fresh: false }
}

export function groupInventory(rawItems, marketData = {}) {
  const grouped = {}
  for (const entry of rawItems) {
    const id = entry.assetId
    if (!grouped[id]) {
      grouped[id] = {
        assetId:  id,
        name:     entry.name ?? `Item ${id}`,
        rap:      entry.recentAveragePrice ?? 0,
        value:    marketData[id]?.value ?? -1,
        quantity: 0,
      }
    }
    grouped[id].quantity++
  }
  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
}

// ─── postAd — delegado ao main process via IPC ─────────────────────────────
//
// O fetch() do renderer não pode setar o header "Cookie" manualmente
// (bloqueado pelo browser por segurança). A requisição ia sem cookie,
// causando 401/403 e o erro "Cookie expired or invalid".
// Agora delegamos para window.electronAPI.rolimons.postAd(), que executa
// net.fetch() no processo main onde não há essa restrição — idêntico ao
// que o código Python antigo fazia com requests.post().
//
export async function postAd(userId, cookie, offerItemIds, tags, requestItemIds = []) {
  // Fallback para ambiente não-Electron (ex: dev browser puro)
  if (!window.electronAPI?.rolimons?.postAd) {
    console.warn('[postAd] electronAPI não disponível — tentando fetch direto (pode falhar sem cookie)')
    return _postAdFallback(userId, cookie, offerItemIds, tags, requestItemIds)
  }

  const { status, message: msg, parsed } = await window.electronAPI.rolimons.postAd({
    userId, cookie, offerItemIds, tags, requestItemIds,
  })

  if (status === 0) return { ok: false, message: `Connection error: ${msg}` }
  if (status === 401 || status === 403) throw new CookieExpiredError(`HTTP ${status}`)
  if (/not verified|not authenticated|invalid session|log in/i.test(msg)) throw new CookieExpiredError(msg)
  if (msg === 'Ad creation cooldown has not elapsed') return { ok: false, message: 'Cooldown has not elapsed yet' }
  if (status !== 201) return { ok: false, message: `HTTP ${status}: ${JSON.stringify(parsed).slice(0, 200)}` }

  return { ok: true, message: 'Ad posted successfully' }
}

async function _postAdFallback(userId, cookie, offerItemIds, tags, requestItemIds) {
  const res = await fetch('https://api.rolimons.com/tradeads/v1/createad', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${COOKIE_NAME}=${cookie}`,
      'User-Agent': UA,
    },
    body: JSON.stringify({
      player_id:        userId,
      offer_item_ids:   offerItemIds,
      request_item_ids: requestItemIds,
      request_tags:     tags,
    }),
  })

  if (res.status === 401 || res.status === 403) throw new CookieExpiredError(`HTTP ${res.status}`)

  let parsed = {}
  try { parsed = await res.json() } catch { /* ignore */ }

  const msg = String(parsed.message ?? '')
  if (/not verified|not authenticated|invalid session|log in/i.test(msg)) throw new CookieExpiredError(msg)
  if (msg === 'Ad creation cooldown has not elapsed') return { ok: false, message: 'Cooldown has not elapsed yet' }
  if (res.status !== 201) return { ok: false, message: `HTTP ${res.status}: ${JSON.stringify(parsed).slice(0, 200)}` }

  return { ok: true, message: 'Ad posted successfully' }
}

// ─── Discord Webhook ──────────────────────────────────────────────────────────

export async function notifyWebhook(webhookUrl, embed) {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch { /* silently fail */ }
}

export function formatNumber(n) {
  try { return Number(Math.round(Number(n))).toLocaleString('pt-BR') }
  catch { return String(n) }
}

export { POST_INTERVAL_MS, COOKIE_NAME }
