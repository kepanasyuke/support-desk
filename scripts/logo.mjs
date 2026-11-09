import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const logoDir = path.join(root, "design", "logo");
const pngDir = path.join(logoDir, "png");
const assets = path.join(root, "desktop", "assets");

const CHOSEN = "icon-c-resolved";
const VARIANTS = ["icon-a-chat", "icon-b-monogram", "icon-c-resolved"];
const SHEET_SIZES = [256, 96, 64, 32, 16];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const APP_SIZES = [512, 256, 128, 64, 48, 32, 16];
const SHEET_NAMES = { "icon-a-chat": "Реплики", "icon-b-monogram": "Монограмма SD", "icon-c-resolved": "Решённый тикет" };

function markup(name) {
  return fs.readFileSync(path.join(logoDir, `${name}.svg`), "utf-8").replace(/<\?xml[^>]*>/, "");
}

function cell(name, size) {
  return `<div style="width:${size}px;height:${size}px">${markup(name)}</div>`;
}

function sized(name, size) {
  return `<div style="width:${size}px;height:${size}px">${markup(name)}</div>`
    .replace("<svg ", `<svg width="${size}" height="${size}" `);
}

async function render(browser, name, size, output) {
  const context = await browser.newContext({ viewport: { width: size + 40, height: size + 40 }, deviceScaleFactor: 1 });
  const view = await context.newPage();

  await view.setContent(`<html><body style="margin:0;background:transparent">
    <style>svg{display:block;width:100%;height:100%}</style>${cell(name, size)}</body></html>`);
  await view.locator("div").screenshot({ path: output, omitBackground: true });
  await context.close();

  return output;
}

async function sheet(browser) {
  const rows = SHEET_SIZES.map((size) => `<div style="display:flex;gap:48px;align-items:flex-end;margin-bottom:28px">${VARIANTS.map((name) => sized(name, size)).join("")}</div>`).join("");
  const head = VARIANTS.map((name) => `<span style="display:block;width:256px;color:#5D6B98;font:13px Inter,sans-serif">${SHEET_NAMES[name]}</span>`).join("");
  const context = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
  const view = await context.newPage();

  await view.setContent(`<html><body style="margin:0;padding:40px;background:#F5F7FA">
    <style>svg{display:block;width:100%;height:100%}</style>
    <div style="display:flex;gap:48px;margin-bottom:16px">${head}</div>${rows}</body></html>`);
  await view.screenshot({ path: path.join(logoDir, "preview.png"), fullPage: true });
  await context.close();
}

function icoEntry(buffer, offset) {
  const size = buffer.readUInt32BE(16);
  const header = Buffer.alloc(16);

  header.writeUInt8(size >= 256 ? 0 : size, 0);
  header.writeUInt8(size >= 256 ? 0 : size, 1);
  header.writeUInt16LE(1, 4);
  header.writeUInt16LE(32, 6);
  header.writeUInt32LE(buffer.length, 8);
  header.writeUInt32LE(offset, 12);

  return header;
}

function icoFile(buffers) {
  const head = Buffer.alloc(6);
  const entries = [];
  let offset = 6 + buffers.length * 16;

  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(buffers.length, 4);

  buffers.forEach((buffer) => {
    entries.push(icoEntry(buffer, offset));
    offset += buffer.length;
  });

  return Buffer.concat([head, ...entries, ...buffers]);
}

async function main() {
  fs.mkdirSync(pngDir, { recursive: true });

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const name of VARIANTS) {
    await render(browser, name, 256, path.join(pngDir, `${name}-256.png`));
  }

  await sheet(browser);

  for (const size of APP_SIZES) {
    await render(browser, CHOSEN, size, path.join(assets, `icon-${size}.png`));
  }

  const ico = [];

  for (const size of ICO_SIZES) {
    ico.push(await render(browser, CHOSEN, size, path.join(assets, `icon-${size}.png`)));
  }

  fs.writeFileSync(path.join(assets, "icon.ico"), icoFile(ico.map((file) => fs.readFileSync(file))));
  fs.copyFileSync(path.join(assets, "icon-512.png"), path.join(assets, "icon.png"));

  await browser.close();
  console.log(`Иконки: ${VARIANTS.length} варианта, ICO ${ICO_SIZES.join("/")}`);
}

main().catch((error) => {
  console.error(`Иконки не собраны: ${error.message}`);
  process.exitCode = 1;
});
