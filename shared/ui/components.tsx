import React from "react";
import { Logo } from "./Logo";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent" | "primary";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "md" | "sm";
}) {
  const variantClass = `sd-btn--${variant}`;
  const sizeClass = size === "sm" ? "sd-btn--sm" : "";
  return <button className={cx("sd-btn", variantClass, sizeClass, className)} {...rest} />;
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("sd-input", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("sd-select", className)} {...rest}>{children}</select>;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("sd-textarea", className)} {...rest} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="sd-field">
      <span className="sd-label">{label}</span>
      {children}
      {hint ? <span className="sd-subtle" style={{ fontSize: 12 }}>{hint}</span> : null}
    </label>
  );
}

export function Badge({ tone = "neutral", children, dot = true }: { tone?: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={`sd-badge sd-badge--${tone}`}>
      {dot ? <span className="sd-badge__dot" /> : null}
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("sd-card", className)}>{children}</section>;
}

export function CardHead({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <header className="sd-card__head">
      <h2 className="sd-card__title">{title}</h2>
      {actions ? <div className="sd-row">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("sd-card__body", className)}>{children}</div>;
}

export function CardFoot({ children }: { children: React.ReactNode }) {
  return <footer className="sd-card__foot">{children}</footer>;
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="sd-stat">
      <span className="sd-stat__label">{label}</span>
      <span className="sd-stat__value">{value}</span>
      {hint ? <span className="sd-stat__hint">{hint}</span> : null}
    </div>
  );
}

export function PageHead({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="sd-page-head">
      <div>
        <h1 className="sd-page-head__title">{title}</h1>
        {description ? <p className="sd-page-head__desc">{description}</p> : null}
      </div>
      {actions ? <div className="sd-row">{actions}</div> : null}
    </div>
  );
}

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="sd-table-wrap">
      <table className="sd-table">
        <thead>
          <tr>{head.map((cell, index) => <th key={index}>{cell}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Progress({ value, tone }: { value: number; tone?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="sd-progress">
      <div className="sd-progress__fill" style={{ width: `${clamped}%`, background: tone }} />
    </div>
  );
}

export function Score({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = clamped >= 70 ? "var(--sd-success)" : clamped >= 40 ? "var(--sd-warning)" : "var(--sd-danger)";
  return (
    <div className="sd-score">
      <div className="sd-score__fill" style={{ width: `${clamped}%`, background: tone }} />
    </div>
  );
}

export function Empty({ title, description, action, art }: { title: string; description?: string; action?: React.ReactNode; art?: React.ReactNode }) {
  return (
    <div className="sd-empty">
      {art ? <div className="sd-empty__art">{art}</div> : null}
      <div className="sd-empty__title">{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function Tip({ art, title, text }: { art?: React.ReactNode; title: string; text: string }) {
  return (
    <div className="sd-tip">
      {art ? <div className="sd-tip__art">{art}</div> : null}
      <div>
        <div className="sd-tip__title">{title}</div>
        <div className="sd-tip__text">{text}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="sd-spinner" role="status" aria-label="Загрузка" />;
}

const SKELETON_WIDTHS = ["26%", "18%", "14%", "12%", "16%", "14%"];

export function Skeleton({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div className="sd-skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="sd-skeleton-lines" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? "58%" : "100%"} height={12} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="sd-skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div className="sd-skeleton-row" key={row}>
          {Array.from({ length: cols }, (_, col) => (
            <Skeleton key={col} width={SKELETON_WIDTHS[col % SKELETON_WIDTHS.length]} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="sd-skeleton-cards" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="sd-skeleton-card" key={index}>
          <Skeleton width="44%" height={10} />
          <Skeleton width="66%" height={20} />
        </div>
      ))}
    </div>
  );
}

export function Wait({ ready, skeleton, children }: { ready: boolean; skeleton: React.ReactNode; children: React.ReactNode }) {
  return <>{ready ? children : skeleton}</>;
}

export function Alert({ tone = "info", children }: { tone?: "info" | "danger" | "success"; children: React.ReactNode }) {
  return <div className={`sd-alert sd-alert--${tone}`}>{children}</div>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return <div className="sd-avatar">{initials}</div>;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="sd-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          className="sd-tab"
          aria-selected={tab.id === value}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sd-modal-backdrop" onClick={onClose} role="presentation">
      <div className="sd-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="sd-modal__head">
          <span>{title}</span>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">✕</Button>
        </header>
        <div className="sd-modal__body">{children}</div>
      </div>
    </div>
  );
}

export function AiPanel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="sd-ai-panel">
      <div className="sd-ai-panel__head">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function AppShell({
  brand,
  subtitle,
  nav,
  current,
  onNavigate,
  topbarRight,
  embedded = false,
  children,
}: {
  brand: string;
  subtitle: string;
  nav: Array<{ id: string; label: string }>;
  current: string;
  onNavigate: (id: string) => void;
  topbarRight?: React.ReactNode;
  embedded?: boolean;
  children: React.ReactNode;
}) {
  const shellClass = embedded ? "sd-app sd-app--embedded" : "sd-app";

  return (
    <div className={shellClass}>
      {embedded ? null : (
        <aside className="sd-sidebar">
          <div className="sd-brand">
            <div className="sd-brand__mark">
              <Logo size={20} />
            </div>
            <div>
              <div className="sd-brand__name">{brand}</div>
              <div className="sd-brand__sub">{subtitle}</div>
            </div>
          </div>
          <nav className="sd-stack" style={{ gap: 2 }}>
            {nav.map((item) => (
              <button
                key={item.id}
                className="sd-nav-item"
                aria-current={item.id === current ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      )}
      <div className="sd-main sd-canvas">
        {embedded ? (
          <header className="sd-topbar sd-topbar--embedded">
            <span className="sd-subtle" style={{ fontSize: 12 }}>{subtitle}</span>
            <div className="sd-row">{topbarRight}</div>
          </header>
        ) : (
          <header className="sd-topbar">
            <div className="sd-row" style={{ gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>{brand}</div>
                <div className="sd-subtle" style={{ fontSize: 12 }}>{subtitle}</div>
              </div>
            </div>
            <div className="sd-row">{topbarRight}</div>
          </header>
        )}
        <main className="sd-content">{children}</main>
      </div>
    </div>
  );
}
