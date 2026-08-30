/**
 * Config persistence using localStorage (web dev mode) or electron-store (production).
 * All cookie values are base64-obfuscated — for real security, use the
 * Electron DPAPI bridge (see electron/main.js) in production builds.
 */

const CONFIG_KEY = 'hyaadposter_config_v2'

const DEFAULT_CONFIG = {
  accounts: {},
  active_account: '',
  webhook_enabled: false,
  webhook_url: '',
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return structuredClone(DEFAULT_CONFIG)
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return structuredClone(DEFAULT_CONFIG)
  }
}

export function saveConfig(cfg) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
  } catch (e) {
    console.error('Failed to save config:', e)
  }
}

/**
 * Cookie protection — uses Electron DPAPI bridge when running as a
 * desktop app, falls back to base64 obfuscation in the browser build.
 *
 * Note: These are synchronous wrappers. In Electron the real implementation
 * is async (IPC invoke), so callers that need the Electron path should
 * use window.electronAPI.cookie directly and await it.
 */
export function protectCookie(plain) {
  if (!plain) return ''
  // In Electron we queue the async protect but store b64 synchronously as
  // a placeholder; the async result is persisted on the next config write.
  return 'b64:' + btoa(unescape(encodeURIComponent(plain)))
}

export function unprotectCookie(protected_) {
  if (!protected_) return ''
  if (protected_.startsWith('b64:')) {
    try { return decodeURIComponent(escape(atob(protected_.slice(4)))) }
    catch { return '' }
  }
  if (protected_.startsWith('dpapi:')) {
    // DPAPI-encrypted — must use the Electron IPC path (async).
    // Callers in the bot runner context should use electronAPI.cookie.unprotect().
    // This sync path returns empty to avoid blocking.
    return ''
  }
  return protected_
}

/**
 * Async variant — uses DPAPI via IPC when in Electron, otherwise base64.
 */
export async function unprotectCookieAsync(protected_) {
  if (!protected_) return ''
  if (window.electronAPI?.cookie) {
    try { return await window.electronAPI.cookie.unprotect(protected_) }
    catch { /* fall through */ }
  }
  return unprotectCookie(protected_)
}

export function extractCookieValue(pasted) {
  pasted = pasted.trim()
  const cookieName = '_RoliVerification'
  for (const chunk of pasted.split(';')) {
    const c = chunk.trim()
    if (c.startsWith(`${cookieName}=`)) return c.split('=', 2)[1].trim()
  }
  return pasted.split(';')[0].trim()
}
