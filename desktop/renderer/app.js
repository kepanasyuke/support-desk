const state = { current: "overview", modules: [], health: {} };

const MODULES = () => state.modules;

function icon(name, size) {
  return window.SD_ICON ? window.SD_ICON(name, size) : "";
}

function healthDot(module) {
  const status = state.health[module.id] || "unknown";

  return `<span class="health health--${status}" title="бэкенд: ${status}"></span>`;
}

function navItem(module) {
  const button = document.createElement("button");

  button.className = "sd-nav-item";
  button.dataset.id = module.id;
  button.innerHTML = `${icon(module.icon)}<span class="nav-label">${module.title}</span>${healthDot(module)}`;
  button.addEventListener("click", () => window.selectModule(module.id));

  return button;
}

function card(module) {
  const article = document.createElement("button");

  article.className = "module-card";
  article.innerHTML = `
    <span class="module-card__head">
      <span class="module-card__icon">${icon(module.icon, 20)}</span>
      <span class="module-card__id">${module.id}</span>
    </span>
    <span class="module-card__title">${module.title}</span>
    <span class="module-card__subtitle">${module.subtitle}</span>
    <span class="module-card__action">Открыть раздел ${icon("arrow", 14)}</span>
  `;
  article.addEventListener("click", () => window.selectModule(module.id));

  return article;
}

function markActive(id) {
  document.querySelectorAll(".sd-nav-item").forEach((item) => {
    item.setAttribute("aria-current", item.dataset.id === id ? "page" : "false");
  });
}

function selectModule(id) {
  const module = MODULES().find((item) => item.id === id);

  markActive(id);
  document.getElementById("overview").hidden = Boolean(module);
  document.getElementById("frame").hidden = !module;
  document.getElementById("module-title").textContent = module ? module.title : "Обзор";
  document.getElementById("module-subtitle").textContent = module
    ? module.subtitle
    : "Восемь модулей клиентской поддержки в одном окне";

  if (module) {
    document.getElementById("frame").src = `http://127.0.0.1:${module.web}/?embed=1`;
  }
}

function buildSidebar() {
  const nav = document.getElementById("nav");
  const overview = document.createElement("button");

  overview.className = "sd-nav-item";
  overview.dataset.id = "overview";
  overview.innerHTML = `${icon("overview")}<span class="nav-label">Обзор</span>`;
  overview.addEventListener("click", () => window.selectModule("overview"));
  nav.append(overview, ...MODULES().map(navItem));
}

function buildOverview() {
  document.getElementById("overview-grid").append(...MODULES().map(card));
}

function renderHealth() {
  document.querySelectorAll(".sd-nav-item[data-id]").forEach((item) => {
    const module = MODULES().find((entry) => entry.id === item.dataset.id);
    const dot = module ? item.querySelector(".health") : null;

    if (dot) {
      dot.className = `health health--${state.health[module.id] || "unknown"}`;
    }
  });
}

async function pingModule(module) {
  try {
    const response = await fetch(`http://127.0.0.1:${module.web}${module.health}`, { cache: "no-store" });

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function collectHealth() {
  if (window.SD_HEALTH) {
    return window.SD_HEALTH();
  }

  const pairs = await Promise.all(MODULES().map(async (module) => [module.id, (await pingModule(module)) ? "up" : "down"]));

  return Object.fromEntries(pairs);
}

async function probeAll() {
  state.health = (await collectHealth()) || {};
  renderHealth();

  const up = MODULES().filter((module) => state.health[module.id] === "up").length;
  const indicator = document.getElementById("health-indicator");

  indicator.className = `health health--${up === MODULES().length ? "up" : up > 0 ? "unknown" : "down"}`;
  document.getElementById("health-summary").textContent = summary();
}

function summary() {
  const up = MODULES().filter((module) => state.health[module.id] === "up").length;

  return `${up} из ${MODULES().length} модулей на связи`;
}

async function loadModules() {
  if (window.SD_MODULES && window.SD_MODULES.length) {
    return window.SD_MODULES;
  }

  const response = await fetch("../modules.json");

  return response.json();
}

async function start() {
  state.modules = await loadModules();

  buildSidebar();
  buildOverview();
  selectModule("overview");
  await probeAll();
}

window.selectModule = selectModule;
window.refreshHealth = probeAll;

start().catch((error) => {
  document.getElementById("module-subtitle").textContent = `Не удалось загрузить модули: ${error.message}`;
});
