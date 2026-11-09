import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
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
const DEFAULT_BOUNDS = { width: 1440, height: 920 };

let mainWindow = null;
let splashWindow = null;
let splashStartedAt = 0;

app.setName("Support Desk");
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-background-timer-throttling");

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
  const child = spawn(phpPath(), ["-S", `127.0.0.1:${module.api}`, "-t", path.dirname(apiEntry(module)), apiEntry(module)], {
    cwd: root,
    windowsHide: true,
    stdio: "ignore",
  });

  child.on("exit", (code) => console.log(`API ${module.title} на ${module.api} остановился с кодом ${code}`));
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ping(module, timeout = 1500) {
  return new Promise((resolve) => {
    const request = http.get({ host: "127.0.0.1", port: module.web, path: module.health, timeout }, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 400);
    });

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function probeAll() {
  const pairs = await Promise.all(MODULES.map(async (module) => [module.id, (await ping(module)) ? "up" : "down"]));

  return Object.fromEntries(pairs);
}

async function warmUp(attempts = 30, report = () => {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const results = await Promise.all(MODULES.map((module) => ping(module)));

    console.log(`Прогрев ${attempt + 1}/${attempts}: ${results.map((ok, index) => `${MODULES[index].web}=${ok ? "ok" : "нет"}`).join(" ")}`);
    report(results, attempt);

    if (results.every(Boolean)) {
      return true;
    }

    await wait(300);
  }

  return false;
}

function freePort(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, "127.0.0.1");
  });
}

async function busyPorts(attempts = 20) {
  const ports = MODULES.flatMap((module) => [module.api, module.web]);
  let busy = ports;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const states = await Promise.all(ports.map(freePort));

    busy = ports.filter((port, index) => !states[index]);

    if (busy.length === 0) {
      return busy;
    }

    await wait(300);
  }

  return busy;
}

function registerHealthChannel() {
  ipcMain.handle("sd:health", () => probeAll());
}

function stateFile() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadBounds() {
  const raw = fs.existsSync(stateFile()) ? fs.readFileSync(stateFile(), "utf-8") : "{}";
  const saved = JSON.parse(raw);

  return { ...DEFAULT_BOUNDS, ...saved };
}

function saveBounds(window) {
  if (window.isMinimized() || window.isFullScreen()) {
    return;
  }

  const bounds = window.getBounds();

  fs.writeFileSync(stateFile(), JSON.stringify(bounds));
}

function select(window, id) {
  const script = `(function () {
    var button = document.querySelector('.sd-nav-item[data-id="${id}"]');
    if (button) { button.click(); return true; }
    return false;
  })()`;

  return window.webContents.executeJavaScript(script, true);
}

function showAbout(window) {
  dialog.showMessageBox(window, {
    type: "info",
    title: "О программе",
    message: "Support Desk",
    detail: `Восемь модулей клиентской поддержки.\nPHP 8.3 / Yii2 REST + React 18.\nElectron ${process.versions.electron}, Chromium ${process.versions.chrome}.`,
    buttons: ["Закрыть"],
  });
}

function buildMenu(window) {
  const moduleItems = MODULES.map((module, index) => ({
    label: `${module.title}   Ctrl+${index + 1}`,
    accelerator: `Ctrl+${index + 1}`,
    click: () => select(window, module.id),
  }));

  const template = [
    {
      label: "Файл",
      submenu: [
        { label: "Обзор", accelerator: "Ctrl+0", click: () => select(window, "overview") },
        { type: "separator" },
        { label: "Перезапустить сервисы", accelerator: "F5", click: () => restartServices(window) },
        { type: "separator" },
        { role: "quit", label: "Выход" },
      ],
    },
    { label: "Модули", submenu: moduleItems },
    {
      label: "Вид",
      submenu: [
        { role: "reload", label: "Перезагрузить" },
        { role: "forceReload", label: "Перезагрузить без кэша" },
        { type: "separator" },
        { role: "resetZoom", label: "Обычный масштаб" },
        { role: "zoomIn", label: "Крупнее" },
        { role: "zoomOut", label: "Мельче" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Во весь экран" },
        { role: "toggleDevTools", label: "Инструменты разработчика" },
      ],
    },
    {
      label: "Справка",
      submenu: [
        { label: "О программе", click: () => showAbout(window) },
        {
          label: "Репозиторий на GitHub",
          click: () => shell.openExternal("https://github.com/kepanasyuke/support-desk"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const bounds = loadBounds();
  const window = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: "#f5f7fa",
    title: "Support Desk",
    icon: path.join(here, "assets", "icon.ico"),
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
  window.once("ready-to-show", () => {
    window.show();
    closeSplash();
  });
  window.on("resized", () => saveBounds(window));
  window.on("moved", () => saveBounds(window));
  window.on("close", () => saveBounds(window));

  return window;
}

function pushSplash(state) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("sd:splash", state);
  }
}

function createSplash() {
  const window = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: "#0B5CFF",
    title: "Support Desk",
    icon: path.join(here, "assets", "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(here, "splash-preload.cjs"),
    },
  });

  splashWindow = window;
  window.loadFile(path.join(here, "renderer", "splash.html"));
  window.once("ready-to-show", () => {
    splashStartedAt = Date.now();
    window.show();
  });

  return window;
}

async function holdSplash(minMs = 900) {
  const left = splashStartedAt ? minMs - (Date.now() - splashStartedAt) : 0;

  if (left > 0) {
    await wait(left);
  }
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }

  splashWindow = null;
}

function stopServices() {
  children.splice(0).forEach((child) => child.kill());
  servers.splice(0).forEach((server) => server.close());
}

async function startServices() {
  pushSplash({ progress: 0.06, text: "Проверяю порты…" });

  const busy = await busyPorts();
  console.log(busy.length === 0 ? "Порты свободны" : `Заняты порты: ${busy.join(", ")} — эти модули не поднимутся`);

  const count = bootstrap();
  console.log(`Support Desk: поднято ${count} модулей`);
  pushSplash({ progress: 0.16, text: `Запускаю ${count} сервисов…` });

  const ready = await warmUp(30, (results) => {
    const up = results.filter(Boolean).length;
    pushSplash({ progress: 0.16 + 0.78 * (up / MODULES.length), text: `Готовлю сервисы: ${up} из ${MODULES.length}` });
  });

  console.log(ready ? "Бэкенды готовы" : "Бэкенды не ответили вовремя, окно открываю как есть");

  return ready;
}

function sameImage(previous, current) {
  return Boolean(previous) && previous.equals(current);
}

async function shot(window, name, previous) {
  let buffer = (await window.webContents.capturePage()).toPNG();

  for (let attempt = 0; attempt < 4 && sameImage(previous, buffer); attempt += 1) {
    await wait(1200);
    buffer = (await window.webContents.capturePage()).toPNG();
  }

  fs.writeFileSync(path.join(shotsDir, `${name}.png`), buffer);

  return buffer;
}

async function captureAll(window) {
  fs.mkdirSync(shotsDir, { recursive: true });
  window.show();
  window.setAlwaysOnTop(true);
  window.moveTop();
  await wait(3000);
  await select(window, "overview");
  await wait(1500);
  const taken = ["00-overview"];
  let previous = await shot(window, "00-overview", null);

  for (const module of MODULES) {
    const name = `${module.id}-${module.title.toLowerCase()}`;

    await select(window, module.id);
    await wait(2500);
    previous = await shot(window, name, previous);
    taken.push(name);
  }

  window.setAlwaysOnTop(false);

  return taken;
}

function shutdown() {
  children.forEach((child) => child.kill());
  servers.forEach((server) => server.close());
}

async function restartServices(window) {
  stopServices();

  const ready = await startServices();

  console.log(ready ? "Сервисы перезапущены" : "Сервисы не ответили после перезапуска");
  window.webContents.reload();
}

function wireSplashIpc() {
  ipcMain.on("sd:splash-retry", async () => {
    pushSplash({ progress: 0.02, text: "Перезапускаю сервисы…", retry: false });
    stopServices();

    const ready = await startServices();

    if (!ready) {
      pushSplash({ progress: 0.96, text: "Сервисы не ответили. Проверьте журнал и повторите.", retry: true });
      return;
    }

    pushSplash({ progress: 1, text: "Открываю окно…" });
    await holdSplash();
    openMain();
  });

  ipcMain.on("sd:splash-close", () => app.quit());
}

function openMain() {
  registerHealthChannel();

  const window = createWindow();
  buildMenu(window);

  window.webContents.on("did-fail-load", (event, code, description) => {
    console.error(`Страница не загрузилась: ${code} ${description}`);
  });

  window.webContents.on("render-process-gone", (event, details) => {
    console.error(`Рендерер упал: ${details.reason}`);
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return { action: "deny" };
  });

  window.webContents.on("did-finish-load", () => {
    if (process.env.SD_SHOTS !== "1") {
      return;
    }

    captureAll(window)
      .then((names) => console.log(`Скриншоты: ${names.join(", ")}`))
      .catch((error) => console.error("Скриншоты не сделаны:", error.message));
  });

  return window;
}

app.whenReady().then(async () => {
  const shots = process.env.SD_SHOTS === "1";

  if (!shots) {
    createSplash();
  }

  wireSplashIpc();

  const ready = await startServices();

  if (!ready && !shots) {
    pushSplash({ progress: 0.96, text: "Сервисы не ответили. Можно повторить попытку.", retry: true });
    return;
  }

  pushSplash({ progress: 1, text: "Открываю окно…" });
  await holdSplash();
  openMain();
});

app.on("window-all-closed", () => {
  shutdown();
  app.quit();
});

app.on("before-quit", shutdown);
