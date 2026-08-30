const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { protectCookie, unprotectCookie } = require('./security')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    frame: false,          // custom titlebar
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
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

// Custom titlebar controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())

// Cookie encryption/decryption (DPAPI on Windows, base64 fallback elsewhere)
ipcMain.handle('cookie:protect',   (_event, plain)     => protectCookie(plain))
ipcMain.handle('cookie:unprotect', (_event, protected_) => unprotectCookie(protected_))

// Open external URLs safely
ipcMain.on('shell:openExternal', (_event, url) => {
  const allowed = ['https://www.rolimons.com', 'https://discord.com']
  if (allowed.some(base => url.startsWith(base))) {
    shell.openExternal(url)
  }
})
