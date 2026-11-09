const fs = require("node:fs");
const path = require("node:path");
const { contextBridge } = require("electron");

const file = path.join(__dirname, "modules.json");
const modules = JSON.parse(fs.readFileSync(file, "utf-8"));

contextBridge.exposeInMainWorld("SD_MODULES", modules);
