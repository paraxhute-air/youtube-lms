"use client";

interface Props {
  active: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accentVar?: string;
}

export function Toggle({ active, onChange, disabled, accentVar = "var(--accent)" }: Props) {
  return (
    <button
      onClick={() => onChange(!active)}
      disabled={disabled}
      className="text-xs px-2 py-0.5 rounded transition-colors shrink-0 disabled:opacity-40"
      style={{
        background: active ? accentVar : "var(--border)",
        color: active ? "var(--bg)" : "var(--muted)",
        border: `1px solid ${active ? accentVar : "var(--border)"}`,
      }}
      title={active ? "비활성화" : "활성화"}
    >
      {active ? "on" : "off"}
    </button>
  );
}
