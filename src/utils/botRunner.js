/**
 * BotRunner — drives the ad-posting loop in a standard JS class.
 * The UI layer can call start() / stop() and subscribe to log events.
 *
 * We intentionally keep this as a plain ES module (not a Worker) so it
 * works in both the browser dev build and the Electron renderer without
 * any extra bundler config. Posting is async and non-blocking.
 */

import {
  resolveUserId,
  getUserAvatarUrl,
  postAd,
  notifyWebhook,
  formatNumber,
  POST_INTERVAL_MS,
  CookieExpiredError,
} from './api'

const TAG_LABELS = {
  any:         'Any',
  demand:      'Demand',
  rares:       'Rares',
  rap:         'RAP / Value',
  wishlist:    'Wishlist',
  robux:       'Robux',
  upgrade:     'Upgrade',
  downgrade:   'Downgrade',
  adds:        'Adds',
  projecteds:  'Projecteds',
}

export class BotRunner {
  #username; #cookie; #queue; #profileName; #webhookUrl
  #log; #onCookieExpired; #onStatusChange
  #running = false; #stopResolve = null; #timer = null
  #userId = null; #avatarUrl = ''; #adsPosted = 0

  constructor({ username, cookie, queue, profileName, webhookUrl, onLog, onCookieExpired, onStatusChange }) {
    this.#username = username
    this.#cookie   = cookie
    this.#queue    = queue
    this.#profileName = profileName
    this.#webhookUrl  = webhookUrl
    this.#log           = onLog          ?? (() => {})
    this.#onCookieExpired = onCookieExpired ?? (() => {})
    this.#onStatusChange  = onStatusChange  ?? (() => {})
  }

  get isRunning() { return this.#running }

  async start() {
    if (this.#running) return
    this.#running = true
    this.#adsPosted = 0
    this.#onStatusChange('running')

    try {
      const { id, name } = await resolveUserId(this.#username)
      this.#userId = id
      this.#avatarUrl = await getUserAvatarUrl(id)
      this.#log({ level: 'ok', text: `Connected as ${name} (id ${id})` })
    } catch (e) {
      this.#log({ level: 'error', text: `Could not resolve user: ${e.message}` })
      this.#running = false
      this.#onStatusChange('idle')
      return
    }

    if (!this.#queue?.length) {
      this.#log({ level: 'error', text: 'Profile has no trades in its queue.' })
      this.#running = false
      this.#onStatusChange('idle')
      return
    }

    let index = 0
    while (this.#running) {
      const trade = this.#queue[index % this.#queue.length]
      const offerIds = trade.offer_items.map(i => i.assetId)
      const names = trade.offer_items.map(i => i.name).join(', ')

      try {
        const result = await postAd(
          this.#userId, this.#cookie, offerIds, trade.tags,
          trade.request_item_ids ?? []
        )
        if (result.ok) {
          this.#adsPosted++
          this.#log({ level: 'ok', text: `${result.message} (${names})` })
          await this.#notifySuccess(trade)
        } else {
          this.#log({ level: 'warn', text: `${result.message} (${names})` })
          await this.#notifyWarning(result.message, trade)
        }
      } catch (e) {
        if (e instanceof CookieExpiredError) {
          this.#log({ level: 'error', text: 'Cookie expired or invalid — re-verify the account.' })
          await this.#notifyWarning('Cookie expired. Re-verify the account.', null)
          this.#running = false
          this.#onStatusChange('expired')
          this.#onCookieExpired()
          return
        }
        this.#log({ level: 'error', text: `Cycle error: ${e.message}` })
      }

      index++
      if (!this.#running) break

      this.#log({ level: 'info', text: `Waiting ${POST_INTERVAL_MS / 60000} minutes before next ad…` })
      const waited = await this.#sleep(POST_INTERVAL_MS)
      if (!waited) break  // stop() was called
    }

    this.#log({ level: 'info', text: 'Bot stopped.' })
    this.#running = false
    this.#onStatusChange('idle')
  }

  stop() {
    this.#running = false
    if (this.#timer) clearTimeout(this.#timer)
    if (this.#stopResolve) { this.#stopResolve(false); this.#stopResolve = null }
  }

  /** Returns true if the sleep completed, false if stop() was called mid-sleep */
  #sleep(ms) {
    return new Promise(resolve => {
      this.#stopResolve = resolve
      this.#timer = setTimeout(() => { this.#stopResolve = null; resolve(true) }, ms)
    })
  }

  async #notifySuccess(trade) {
    if (!this.#webhookUrl) return
    const items = trade.offer_items
    const lines = items.slice(0, 10).map(item => {
      const qty = item.quantity > 1 ? ` x${item.quantity}` : ''
      const val = item.value > 0 ? formatNumber(item.value) : 'N/A'
      return `• **${item.name}**${qty} — RAP ${formatNumber(item.rap)} · Value ${val}`
    })
    if (items.length > 10) lines.push(`_…and ${items.length - 10} more_`)

    const totalRap = items.reduce((s, i) => s + (i.rap || 0), 0)
    const totalVal = items.reduce((s, i) => s + (i.value > 0 ? i.value : 0), 0)
    const tagLabel = (trade.tags ?? []).map(t => TAG_LABELS[t] ?? t).join(', ') || '—'

    await notifyWebhook(this.#webhookUrl, {
      title: '🔄 New trade ad posted',
      color: 0x3FC98A,
      author: this.#embedAuthor(),
      fields: [
        { name: 'Profile',       value: this.#profileName || '—', inline: true },
        { name: 'Tags',          value: tagLabel,                  inline: true },
        { name: `Offered items (${items.length})`, value: lines.join('\n') || '—', inline: false },
        { name: 'Total RAP',     value: formatNumber(totalRap),    inline: true },
        { name: 'Total Value',   value: formatNumber(totalVal),    inline: true },
      ],
      footer: { text: `HyaAdPoster · ad #${this.#adsPosted} this session · next in ${POST_INTERVAL_MS / 60000} min` },
      timestamp: new Date().toISOString(),
    })
  }

  async #notifyWarning(message, trade) {
    if (!this.#webhookUrl) return
    const names = trade ? trade.offer_items.map(i => i.name).join(', ') : '—'
    await notifyWebhook(this.#webhookUrl, {
      title: '⚠️ Failed to post ad',
      color: 0xE5566D,
      author: this.#embedAuthor(),
      fields: [
        { name: 'Profile', value: this.#profileName || '—', inline: true },
        { name: 'Reason',  value: message.slice(0, 1000),   inline: false },
        { name: 'Items',   value: names.slice(0, 1000),     inline: false },
      ],
      footer:    { text: 'HyaAdPoster' },
      timestamp: new Date().toISOString(),
    })
  }

  #embedAuthor() {
    const author = { name: this.#username }
    if (this.#userId) author.url = `https://www.rolimons.com/player/${this.#userId}`
    if (this.#avatarUrl) author.icon_url = this.#avatarUrl
    return author
  }
}
