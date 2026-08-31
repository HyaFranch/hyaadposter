const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')
const { protectCookie, unprotectCookie } = require('./security')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png')
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

// ─── Rolimons login window — captures cookie automatically ─────────────────
ipcMain.handle('auth:openLoginWindow', async (_event, existingUsername) => {
  return new Promise((resolve) => {
    // Use an isolated partition so it doesn't share cookies with the main window
    const partition = 'persist:rolimons-login'
    const loginSession = session.fromPartition(partition)

    // Clear old cookies so the user gets a fresh login every time
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

          // Try to read the username from the Roblox session cookie or page title
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

    // Poll every second for the cookie
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
