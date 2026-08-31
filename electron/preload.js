const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),
  },
  shell: {
    openExternal: (url) => ipcRenderer.send('shell:openExternal', url),
  },
  cookie: {
    protect:   (plain) => ipcRenderer.invoke('cookie:protect', plain),
    unprotect: (prot)  => ipcRenderer.invoke('cookie:unprotect', prot),
  },
  auth: {
    // Opens the Rolimons login window and returns { ok, cookie, username }
    openLoginWindow: (existingUsername) => ipcRenderer.invoke('auth:openLoginWindow', existingUsername),
  },
})
