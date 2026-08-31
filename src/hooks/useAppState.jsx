import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { loadConfig, saveConfig, protectCookie, unprotectCookieAsync } from '../utils/config'
import { BotRunner } from '../utils/botRunner'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [cfg, setCfgRaw] = useState(() => loadConfig())
  const [logs, setLogs] = useState([])
  const [botStatus, setBotStatus] = useState('idle')  // idle | running | stopping | expired
  const botRef = useRef(null)

  const setCfg = useCallback(updater => {
    setCfgRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveConfig(next)
      return next
    })
  }, [])

  const addLog = useCallback(({ level = 'info', text }) => {
    setLogs(prev => [
      ...prev.slice(-499),   // keep last 500 entries
      { id: Date.now() + Math.random(), level, text, time: new Date().toLocaleTimeString() },
    ])
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  // ─── Account management ────────────────────────────────────────────────────

  const activeAccount = cfg.accounts[cfg.active_account] ?? null

  const addAccount = useCallback(({ username, cookiePlain }) => {
    const id = crypto.randomUUID().replace(/-/g, '')
    setCfg(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [id]: {
          username,
          cookie_protected: protectCookie(cookiePlain),
          active_profile: '',
          profiles: {},
        },
      },
      active_account: id,
    }))
  }, [setCfg])

  const updateAccountCookie = useCallback((id, cookiePlain) => {
    setCfg(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [id]: { ...prev.accounts[id], cookie_protected: protectCookie(cookiePlain) },
      },
    }))
  }, [setCfg])

  const removeAccount = useCallback(id => {
    setCfg(prev => {
      const accounts = { ...prev.accounts }
      delete accounts[id]
      const active = prev.active_account === id ? Object.keys(accounts)[0] ?? '' : prev.active_account
      return { ...prev, accounts, active_account: active }
    })
  }, [setCfg])

  const setActiveAccount = useCallback(id => {
    setCfg(prev => ({ ...prev, active_account: id }))
  }, [setCfg])

  // ─── Profile management ───────────────────────────────────────────────────

  const createProfile = useCallback((name) => {
    if (!cfg.active_account) return
    setCfg(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [prev.active_account]: {
          ...prev.accounts[prev.active_account],
          profiles: {
            ...prev.accounts[prev.active_account].profiles,
            [name]: { queue: [] },
          },
          active_profile: name,
        },
      },
    }))
  }, [cfg.active_account, setCfg])

  const renameProfile = useCallback((oldName, newName) => {
    if (!cfg.active_account) return
    setCfg(prev => {
      const acc = prev.accounts[prev.active_account]
      const profiles = { ...acc.profiles }
      profiles[newName] = profiles[oldName]
      delete profiles[oldName]
      return {
        ...prev,
        accounts: {
          ...prev.accounts,
          [prev.active_account]: {
            ...acc,
            profiles,
            active_profile: acc.active_profile === oldName ? newName : acc.active_profile,
          },
        },
      }
    })
  }, [cfg.active_account, setCfg])

  const deleteProfile = useCallback(name => {
    if (!cfg.active_account) return
    setCfg(prev => {
      const acc = prev.accounts[prev.active_account]
      const profiles = { ...acc.profiles }
      delete profiles[name]
      const active = acc.active_profile === name ? Object.keys(profiles)[0] ?? '' : acc.active_profile
      return {
        ...prev,
        accounts: {
          ...prev.accounts,
          [prev.active_account]: { ...acc, profiles, active_profile: active },
        },
      }
    })
  }, [cfg.active_account, setCfg])

  const setActiveProfile = useCallback(name => {
    if (!cfg.active_account) return
    setCfg(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [prev.active_account]: { ...prev.accounts[prev.active_account], active_profile: name },
      },
    }))
  }, [cfg.active_account, setCfg])

  // ─── Trade queue management ───────────────────────────────────────────────

  const _mutateQueue = useCallback((profileName, fn) => {
    if (!cfg.active_account || !profileName) return
    setCfg(prev => {
      const acc = prev.accounts[prev.active_account]
      const profiles = {
        ...acc.profiles,
        [profileName]: { ...acc.profiles[profileName], queue: fn(acc.profiles[profileName]?.queue ?? []) },
      }
      return { ...prev, accounts: { ...prev.accounts, [prev.active_account]: { ...acc, profiles } } }
    })
  }, [cfg.active_account, setCfg])

  const addTrade     = useCallback((profileName, trade) => _mutateQueue(profileName, q => [...q, trade]),           [_mutateQueue])
  const updateTrade  = useCallback((profileName, trade) => _mutateQueue(profileName, q => q.map(t => t.id === trade.id ? trade : t)), [_mutateQueue])
  const removeTrade  = useCallback((profileName, id)    => _mutateQueue(profileName, q => q.filter(t => t.id !== id)), [_mutateQueue])
  const moveTrade    = useCallback((profileName, id, dir) => _mutateQueue(profileName, q => {
    const i = q.findIndex(t => t.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= q.length) return q
    const next = [...q]; [next[i], next[j]] = [next[j], next[i]]; return next
  }), [_mutateQueue])

  // ─── Bot control ──────────────────────────────────────────────────────────

  const startBot = useCallback(async ({ profileName }) => {
    if (botRef.current?.isRunning) return
    const acc = cfg.accounts[cfg.active_account]
    if (!acc) return addLog({ level: 'error', text: 'No account selected.' })

    let cookiePlain
    try {
      cookiePlain = await unprotectCookieAsync(acc.cookie_protected)
    } catch (e) {
      return addLog({ level: 'error', text: `Could not read cookie: ${e.message}` })
    }
    if (!cookiePlain) return addLog({ level: 'error', text: 'No cookie saved — verify the account first.' })

    const queue = acc.profiles[profileName]?.queue ?? []
    if (!queue.length) return addLog({ level: 'error', text: 'Profile queue is empty.' })

    const bot = new BotRunner({
      username:    acc.username,
      cookie:      cookiePlain,
      queue,
      profileName,
      webhookUrl:  cfg.webhook_enabled ? cfg.webhook_url : null,
      onLog:            addLog,
      onStatusChange:   setBotStatus,
      onCookieExpired:  () => setBotStatus('expired'),
    })
    botRef.current = bot   // seta ANTES de start() para evitar race condition
    await bot.start()
  }, [cfg, addLog])

  const stopBot = useCallback(() => {
    setBotStatus('stopping')
    botRef.current?.stop()
  }, [])

  return (
    <AppCtx.Provider value={{
      cfg, setCfg,
      logs, addLog, clearLogs,
      botStatus, botRef,
      activeAccount,
      addAccount, updateAccountCookie, removeAccount, setActiveAccount,
      createProfile, renameProfile, deleteProfile, setActiveProfile,
      addTrade, updateTrade, removeTrade, moveTrade,
      startBot, stopBot,
    }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
