const MODULES = window.SD_MODULES || [];

function navItem(module) {
  const button = document.createElement("button");
  button.className = "sd-nav-item";
  button.dataset.id = module.id;
  button.innerHTML = `<span class="nav-dot"></span><span>${module.title}</span><span class="nav-id">${module.id}</span>`;
  button.addEventListener("click", () => window.selectModule(module.id));

  return button;
}

function card(module) {
  const article = document.createElement("button");
  article.className = "module-card";
  article.innerHTML = `
    <span class="module-card__id">${module.id}</span>
    <span class="module-card__title">${module.title}</span>
    <span class="module-card__subtitle">${module.subtitle}</span>
    <span class="module-card__action">Открыть раздел →</span>
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
  const module = MODULES.find((item) => item.id === id);

  markActive(id);
  document.getElementById("overview").hidden = Boolean(module);
  document.getElementById("frame").hidden = !module;
  document.getElementById("module-title").textContent = module ? module.title : "Обзор";
  document.getElementById("module-subtitle").textContent = module
    ? module.subtitle
    : "Восемь модулей клиентской поддержки в одном окне";

  if (module) {
    document.getElementById("frame").src = `http://127.0.0.1:${module.web}/`;
  }
}

function buildSidebar() {
  const nav = document.getElementById("nav");
  const overview = document.createElement("button");

  overview.className = "sd-nav-item";
  overview.dataset.id = "overview";
  overview.innerHTML = '<span class="nav-dot"></span><span>Обзор</span><span class="nav-id">все</span>';
  overview.addEventListener("click", () => window.selectModule("overview"));
  nav.append(overview, ...MODULES.map(navItem));
}

function buildOverview() {
  document.getElementById("overview-grid").append(...MODULES.map(card));
}

window.selectModule = selectModule;

buildSidebar();
buildOverview();
selectModule("overview");
