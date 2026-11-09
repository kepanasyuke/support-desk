const BASE = {
  viewBox: "0 0 160 120",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HelpdeskArt() {
  return (
    <svg {...BASE}>
      <rect x="18" y="20" width="96" height="24" rx="8" />
      <path d="M30 32h44" />
      <rect x="18" y="52" width="96" height="24" rx="8" />
      <path d="M30 64h32" />
      <rect x="18" y="84" width="96" height="24" rx="8" />
      <path d="M30 96h52" />
      <path d="M128 32l10 10-10 10" />
      <circle cx="138" cy="92" r="7" fill="var(--sd-accent)" stroke="none" />
    </svg>
  );
}

export function InboxArt() {
  return (
    <svg {...BASE}>
      <rect x="14" y="24" width="88" height="52" rx="12" />
      <path d="M34 76v16l18-16" />
      <circle cx="40" cy="50" r="4" fill="currentColor" stroke="none" />
      <circle cx="58" cy="50" r="4" fill="currentColor" stroke="none" />
      <circle cx="76" cy="50" r="4" fill="currentColor" stroke="none" />
      <rect x="94" y="66" width="50" height="34" rx="10" fill="var(--sd-primary-soft)" />
      <path d="M104 78h30" />
      <path d="M104 90h18" />
      <circle cx="132" cy="36" r="7" fill="var(--sd-accent)" stroke="none" />
    </svg>
  );
}

export function SlaArt() {
  return (
    <svg {...BASE}>
      <circle cx="66" cy="66" r="34" />
      <path d="M66 66V44" />
      <path d="M66 66l14 10" />
      <path d="M66 32v-8" />
      <path d="M56 18h20" />
      <path d="M124 40l18 30h-36z" />
      <path d="M124 54v8" />
      <circle cx="124" cy="67" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KnowledgeArt() {
  return (
    <svg {...BASE}>
      <rect x="18" y="20" width="66" height="84" rx="8" />
      <path d="M30 42h42" />
      <path d="M30 56h42" />
      <path d="M30 70h26" />
      <circle cx="112" cy="70" r="20" />
      <path d="M126 84l14 14" />
      <circle cx="112" cy="70" r="5" fill="var(--sd-primary-soft)" stroke="none" />
    </svg>
  );
}

export function SuggestArt() {
  return (
    <svg {...BASE}>
      <rect x="24" y="20" width="72" height="88" rx="8" />
      <path d="M38 42h44" />
      <path d="M38 56h44" />
      <path d="M38 70h30" />
      <path d="M124 30l4.5 12 12 4.5-12 4.5-4.5 12-4.5-12-12-4.5 12-4.5z" fill="var(--sd-accent)" stroke="none" />
      <path d="M112 82h24" />
    </svg>
  );
}

export function CsatArt() {
  return (
    <svg {...BASE}>
      <circle cx="64" cy="64" r="32" />
      <circle cx="54" cy="56" r="3" fill="currentColor" stroke="none" />
      <circle cx="74" cy="56" r="3" fill="currentColor" stroke="none" />
      <path d="M52 74c4 6 20 6 24 0" />
      <path d="M122 26l3.5 9.5 9.5 3.5-9.5 3.5-3.5 9.5-3.5-9.5-9.5-3.5 9.5-3.5z" fill="var(--sd-accent)" stroke="none" />
      <path d="M112 66h20" />
      <path d="M118 82h14" />
    </svg>
  );
}

export function PortalArt() {
  return (
    <svg {...BASE}>
      <rect x="16" y="22" width="128" height="78" rx="10" />
      <path d="M16 44h128" />
      <path d="M56 44v56" />
      <path d="M26 58h20" />
      <path d="M26 72h20" />
      <path d="M72 58h56" />
      <path d="M72 74h38" />
      <circle cx="134" cy="33" r="3" fill="var(--sd-accent)" stroke="none" />
    </svg>
  );
}

export function WorkloadArt() {
  return (
    <svg {...BASE}>
      <circle cx="42" cy="42" r="12" />
      <path d="M24 88c0-12 8-20 18-20s18 8 18 20" />
      <circle cx="78" cy="54" r="10" />
      <path d="M64 88c0-10 6-16 14-16s14 6 14 16" />
      <rect x="104" y="34" width="40" height="8" rx="4" fill="var(--sd-primary-soft)" />
      <rect x="104" y="50" width="28" height="8" rx="4" fill="var(--sd-primary-soft)" />
      <rect x="104" y="66" width="34" height="8" rx="4" fill="var(--sd-primary-soft)" />
      <circle cx="140" cy="92" r="7" fill="var(--sd-accent)" stroke="none" />
    </svg>
  );
}
