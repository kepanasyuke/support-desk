const fs = require("node:fs");
const path = require("node:path");
const { contextBridge, ipcRenderer } = require("electron");

const file = path.join(__dirname, "modules.json");
const modules = JSON.parse(fs.readFileSync(file, "utf-8"));

contextBridge.exposeInMainWorld("SD_MODULES", modules);
contextBridge.exposeInMainWorld("SD_HEALTH", () => ipcRenderer.invoke("sd:health"));
