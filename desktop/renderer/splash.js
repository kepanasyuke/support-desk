const fill = document.getElementById("fill");
const track = document.getElementById("track");
const status = document.getElementById("status");
const actions = document.getElementById("actions");

function render(state) {
  const percent = Math.max(0, Math.min(100, Math.round((state.progress || 0) * 100)));

  fill.style.width = `${percent}%`;
  track.setAttribute("aria-valuenow", String(percent));

  if (state.text) {
    status.textContent = state.text;
  }

  actions.hidden = !state.retry;
}

if (window.sdSplash) {
  window.sdSplash.onState(render);
  document.getElementById("retry").addEventListener("click", () => {
    render({ progress: 0, text: "Пробую снова…", retry: false });
    window.sdSplash.retry();
  });
  document.getElementById("close").addEventListener("click", () => window.sdSplash.close());
}
