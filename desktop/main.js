import { app, BrowserWindow, Menu, dialog, shell } from "electron";
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
const DEFAULT_BOUNDS = { width: 1440, height: 920 };

let mainWindow = null;

app.setName("Support Desk");
app.disableHardwareAcceleration();

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
  window.once("ready-to-show", () => window.show());
  window.on("resized", () => saveBounds(window));
  window.on("moved", () => saveBounds(window));
  window.on("close", () => saveBounds(window));

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

async function captureAll(window) {
  fs.mkdirSync(shotsDir, { recursive: true });
  await wait(3000);
  await select(window, "overview");
  await wait(1200);
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

app.whenReady().then(() => {
  const count = bootstrap();
  console.log(`Support Desk: поднято ${count} модулей`);

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
});

app.on("window-all-closed", () => {
  shutdown();
  app.quit();
});

app.on("before-quit", shutdown);
