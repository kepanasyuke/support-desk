const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sdSplash", {
  onState: (callback) => ipcRenderer.on("sd:splash", (event, state) => callback(state)),
  retry: () => ipcRenderer.send("sd:splash-retry"),
  close: () => ipcRenderer.send("sd:splash-close"),
});
