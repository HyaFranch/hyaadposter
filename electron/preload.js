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
    openLoginWindow: (existingUsername) => ipcRenderer.invoke('auth:openLoginWindow', existingUsername),
  },
  rolimons: {
    // postAd é feito pelo main process para poder setar o header Cookie livremente
    postAd: (args) => ipcRenderer.invoke('rolimons:postAd', args),
  },
})
