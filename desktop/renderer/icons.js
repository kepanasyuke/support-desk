const ICON_PATHS = {
  overview:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  helpdesk:
    '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8Z"/><path d="M8.5 10.5h7M8.5 14h4"/>',
  inbox:
    '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M3 13v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
  sla: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  knowledge:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z"/><path d="M8 7.5h7M8 11h5"/>',
  suggest:
    '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z"/><path d="M18 15.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9Z"/>',
  csat: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9Z"/>',
  portal:
    '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r="0.9" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6.5" r="0.9" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="2.5"/><path d="M7.5 19.5a4.5 4.5 0 0 1 9 0"/>',
  workload:
    '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 5.6a3.2 3.2 0 0 1 0 6.3M17.5 14.4a5.5 5.5 0 0 1 3 5.1"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

window.SD_ICON = function sdIcon(name, size) {
  const body = ICON_PATHS[name] || ICON_PATHS.overview;
  const dimension = size || 18;

  return `<svg class="icon" width="${dimension}" height="${dimension}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};
