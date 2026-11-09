import { app, BrowserWindow, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStatic } from "./server.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const shotsDir = path.join(root, "screenshots");
const MODULES = JSON.parse(fs.readFileSync(path.join(here, "modules.json"), "utf-8"));

const PHP_CANDIDATES = [
  process.env.SD_PHP,
  "C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.NTS.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe",
  "php",
].filter(Boolean);

const children = [];
const servers = [];

let mainWindow = null;

function phpPath() {
  return PHP_CANDIDATES.find((candidate) => candidate === "php" || fs.existsSync(candidate));
}

function apiEntry(module) {
  return path.join(root, "projects", module.folder, "api", "web", "index.php");
}

function distDir(module) {
  return path.join(root, "projects", module.folder, "web", "dist");
}

function startApi(module) {
  const binary = phpPath();
  const child = spawn(binary, ["-S", `127.0.0.1:${module.api}`, "-t", path.dirname(apiEntry(module)), apiEntry(module)], {
    cwd: root,
    windowsHide: true,
    stdio: "ignore",
  });

  children.push(child);

  return child;
}

function startWeb(module) {
  const server = startStatic(distDir(module), module.web, module.api);
  servers.push(server);

  return server;
}

function bootstrap() {
  MODULES.forEach(startApi);
  MODULES.forEach(startWeb);

  return MODULES.length;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show:false,
    backgroundColor: "#f5f7fa",
    title: "Support Desk",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      sandbox: false,
      preload: path.join(here, "preload.cjs"),
    },
  });

  mainWindow = window;

  window.loadFile(path.join(here, "renderer", "index.html"));
  window.once("ready-to-show", () => window.show());

  return window;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shot(window, name) {
  const image = await window.webContents.capturePage();
  fs.writeFileSync(path.join(shotsDir, `${name}.png`), image.toPNG());

  return name;
}

async function select(window, id) {
  const script = `(function () {
    var button = document.querySelector('.sd-nav-item[data-id="${id}"]');
    if (button) { button.click(); return true; }
    return false;
  })()`;

  return window.webContents.executeJavaScript(script, true);
}

async function captureAll(window) {
  fs.mkdirSync(shotsDir, { recursive: true });
  await wait(2500);
  await select(window, "overview");
  await wait(900);
  const taken = [await shot(window, "00-overview")];

  for (const module of MODULES) {
    await select(window, module.id);
    await wait(4500);
    taken.push(await shot(window, `${module.id}-${module.title.toLowerCase()}`));
  }

  return taken;
}

function shutdown() {
  children.forEach((child) => child.kill());
  servers.forEach((server) => server.close());
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  const count = bootstrap();
  console.log(`Support Desk: поднято ${count} модулей`);

  const window = createWindow();

  window.webContents.on("did-fail-load", (event, code, description) => {
    console.error(`Страница не загрузилась: ${code} ${description}`);
  });

  window.webContents.on("render-process-gone", (event, details) => {
    console.error(`Рендерер упал: ${details.reason}`);
  });

  app.on("child-process-gone", (event, details) => {
    console.error(`Дочерний процесс завершился: ${details.type} ${details.reason}`);
  });

  window.webContents.on("console-message", (event, level, message) => {
    console.log(`[renderer:${level}] ${message}`);
  });

  window.webContents.on("did-finish-load", () => {
    console.log("Страница загружена");

    window.webContents
      .executeJavaScript("document.querySelectorAll('.sd-nav-item').length")
      .then((items) => console.log(`Навигация: ${items} пунктов`))
      .catch((error) => console.error("Рендерер не ответил:", error.message));

    captureAll(window)
      .then((names) => console.log(`Скриншоты: ${names.join(", ")}`))
      .catch((error) => console.error("Скриншоты не сделаны:", error.message));
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return { action: "deny" };
  });
});

app.on("window-all-closed", () => {
  shutdown();
  app.quit();
});

app.on("before-quit", shutdown);
