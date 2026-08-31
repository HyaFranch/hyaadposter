const { app, BrowserWindow, ipcMain, shell, session, net } = require('electron')
const path = require('path')
const fs = require('fs')
const { protectCookie, unprotectCookie } = require('./security')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.ico')
  const iconExists = fs.existsSync(iconPath)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    ...(iconExists ? { icon: iconPath } : {}),
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ─── Custom titlebar ───────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())

// ─── Cookie encryption ─────────────────────────────────────────────────────
ipcMain.handle('cookie:protect',   (_e, plain)  => protectCookie(plain))
ipcMain.handle('cookie:unprotect', (_e, prot)   => unprotectCookie(prot))

// ─── postAd via main process (bypasses browser Cookie header restriction) ──
//
// O fetch() do renderer NÃO consegue setar o header "Cookie" manualmente —
// é bloqueado pelo browser por segurança. Por isso o cookie nunca chegava
// na Rolimons e ela retornava 401/403.
// A solução é fazer a requisição aqui no processo main via net.fetch(),
// onde não há essa restrição.
//
ipcMain.handle('rolimons:postAd', async (_event, { userId, cookie, offerItemIds, tags, requestItemIds }) => {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
  const COOKIE_NAME = '_RoliVerification'

  const body = JSON.stringify({
    player_id:        userId,
    offer_item_ids:   offerItemIds,
    request_item_ids: requestItemIds ?? [],
    request_tags:     tags,
  })

  try {
    const res = await net.fetch('https://api.rolimons.com/tradeads/v1/createad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie':        `${COOKIE_NAME}=${cookie}`,
        'User-Agent':    UA,
      },
      body,
    })

    let parsed = {}
    try { parsed = await res.json() } catch { /* ignore */ }

    const status = res.status
    const msg    = String(parsed.message ?? '')

    return { status, message: msg, parsed }
  } catch (err) {
    return { status: 0, message: err.message, parsed: {} }
  }
})

// ─── Rolimons login window — captures cookie automatically ─────────────────
ipcMain.handle('auth:openLoginWindow', async (_event, existingUsername) => {
  return new Promise((resolve) => {
    const partition = 'persist:rolimons-login'
    const loginSession = session.fromPartition(partition)

    loginSession.clearStorageData({ storages: ['cookies'] })

    const win = new BrowserWindow({
      width: 480,
      height: 780,
      parent: mainWindow,
      modal: true,
      title: 'Sign in to Rolimons',
      autoHideMenuBar: true,
      webPreferences: {
        partition,
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    win.loadURL('https://www.rolimons.com/verify')

    let found = false
    let pollInterval = null

    const checkCookie = async () => {
      try {
        const cookies = await loginSession.cookies.get({ name: '_RoliVerification', url: 'https://www.rolimons.com' })
        if (cookies.length && cookies[0].value) {
          found = true
          clearInterval(pollInterval)

          const cookieValue = cookies[0].value

          let username = existingUsername || ''
          if (!username) {
            try {
              username = await win.webContents.executeJavaScript(`
                (function() {
                  const el = document.querySelector('.player-name, [class*="username"], .navbar-username')
                  return el ? el.textContent.trim() : ''
                })()
              `)
            } catch { /* ignore */ }
          }

          win.close()
          resolve({ ok: true, cookie: cookieValue, username })
        }
      } catch { /* ignore */ }
    }

    pollInterval = setInterval(checkCookie, 1000)

    win.on('closed', () => {
      clearInterval(pollInterval)
      if (!found) resolve({ ok: false, cookie: null, username: null })
    })
  })
})

// ─── Safe external links ───────────────────────────────────────────────────
ipcMain.on('shell:openExternal', (_event, url) => {
  const allowed = ['https://www.rolimons.com', 'https://discord.com', 'https://github.com']
  if (allowed.some(base => url.startsWith(base))) shell.openExternal(url)
})
