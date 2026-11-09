import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStatic } from "../desktop/server.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const output = path.join(root, "docs", "screenshots");
const MODULES = JSON.parse(fs.readFileSync(path.join(root, "desktop", "modules.json"), "utf-8"));

const SHELL_PORT = 5190;
const SPLASH_SIZE = { width: 460, height: 320 };
const PHP = process.env.SD_PHP || "php";

const children = [];
const servers = [];

function apiEntry(module) {
  return path.join(root, "projects", module.folder, "api", "web", "index.php");
}

function startApi(module) {
  const child = spawn(PHP, ["-S", `127.0.0.1:${module.api}`, "-t", path.dirname(apiEntry(module)), apiEntry(module)], {
    cwd: root,
    windowsHide: true,
    stdio: "ignore",
  });

  children.push(child);
}

function startWebs() {
  MODULES.forEach((module) => {
    servers.push(startStatic(path.join(root, "projects", module.folder, "web", "dist"), module.web, module.api));
  });

  servers.push(startStatic(root, SHELL_PORT, MODULES[0].api));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splashState() {
  window.sdSplash = {
    onState(push) {
      setTimeout(() => push({ progress: 0.62, text: "Готовлю сервисы: 5 из 8", retry: false }), 120);
    },
    retry() {},
    close() {},
  };
}

async function shootSplash(browser, url, file) {
  const context = await browser.newContext({ viewport: SPLASH_SIZE, deviceScaleFactor: 2, locale: "ru-RU" });
  const page = await context.newPage();

  await page.addInitScript(splashState);
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wait(600);
  await page.screenshot({ path: path.join(output, file) });
  await context.close();

  return file;
}

async function shootShell(page, url, file) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await wait(1200);
  await page.screenshot({ path: path.join(output, file) });

  return file;
}

async function shootModule(page, module, file) {
  await page.locator(`.sd-nav-item[data-id="${module.id}"]`).click();
  await page.waitForFunction(() => document.getElementById("frame-wait").hidden, null, { timeout: 45000 });
  await wait(1400);
  await page.screenshot({ path: path.join(output, file) });

  return `${module.title}: ${file}`;
}

async function main() {
  fs.mkdirSync(output, { recursive: true });

  MODULES.forEach(startApi);
  startWebs();
  await wait(2500);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "ru-RU" });
  const page = await context.newPage();
  const taken = [];

  taken.push(await shootSplash(browser, `http://127.0.0.1:${SHELL_PORT}/desktop/renderer/splash.html`, "00-loading.png"));
  taken.push(await shootShell(page, `http://127.0.0.1:${SHELL_PORT}/desktop/renderer/index.html`, "00-overview.png"));

  for (const module of MODULES) {
    taken.push(await shootModule(page, module, `${module.id}-${module.title.toLowerCase()}.png`));
  }

  await context.close();
  await browser.close();
  console.log(`Снято ${taken.length} кадров: ${taken.join(", ")}`);
}

function shutdown() {
  children.forEach((child) => child.kill());
  servers.forEach((server) => server.close());
}

main()
  .catch((error) => {
    console.error(`Съёмка не удалась: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(shutdown);
