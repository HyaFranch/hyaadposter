/**
 * Security bridge — exposes DPAPI-backed cookie encryption to the renderer
 * via IPC. Only available on Windows with the optional `win32crypt` binding.
 *
 * On other platforms (Linux, macOS) or when the binding isn't available,
 * we fall back to the same base64 obfuscation used in the browser build.
 * For production deployments, consider using the system keychain via
 * the `keytar` package instead.
 *
 * The renderer never sees the raw cookie — it only passes the protected
 * blob in and gets it back out. The plain value exists in memory only
 * for the duration of a bot session.
 */

let dpapi = null
try {
  // Optional native module — only available on Windows builds that include it
  dpapi = require('win32crypt')
} catch {
  // Not available — use base64 fallback
}

/**
 * Encrypt a cookie value.
 * Returns a base64 string prefixed with either "dpapi:" or "b64:".
 */
function protectCookie(plain) {
  if (!plain) return ''
  if (dpapi) {
    try {
      const blob = dpapi.CryptProtectData(Buffer.from(plain, 'utf-8'), '', null, null, null, 0)
      return 'dpapi:' + blob.toString('base64')
    } catch { /* fall through */ }
  }
  return 'b64:' + Buffer.from(plain, 'utf-8').toString('base64')
}

/**
 * Decrypt a cookie value previously encrypted by protectCookie().
 */
function unprotectCookie(protected_) {
  if (!protected_) return ''
  if (protected_.startsWith('b64:')) {
    return Buffer.from(protected_.slice(4), 'base64').toString('utf-8')
  }
  if (protected_.startsWith('dpapi:')) {
    if (!dpapi) throw new Error('Cookie was encrypted with DPAPI but win32crypt is unavailable')
    const blob = Buffer.from(protected_.slice(6), 'base64')
    return dpapi.CryptUnprotectData(blob, null, null, null, 0)[1].toString('utf-8')
  }
  // Legacy plain text — shouldn't happen but handle gracefully
  return protected_
}

module.exports = { protectCookie, unprotectCookie }
