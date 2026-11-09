export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <mask id="sd-logo-cut">
        <rect width={1024} height={1024} fill="#ffffff" />
        <path
          fill="none"
          stroke="#000000"
          strokeWidth={84}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M390 476L472 558L648 364"
        />
      </mask>
      <path
        fill="currentColor"
        mask="url(#sd-logo-cut)"
        d="M342 232H682A150 150 0 0 1 832 382V542A150 150 0 0 1 682 692H500L342 832V692H342A150 150 0 0 1 192 542V382A150 150 0 0 1 342 232Z"
      />
    </svg>
  );
}
