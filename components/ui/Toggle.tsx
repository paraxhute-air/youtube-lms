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
      className="flex text-xs rounded overflow-hidden shrink-0 disabled:opacity-40"
      style={{ border: "1px solid var(--border)" }}
      title={active ? "비활성화" : "활성화"}
    >
      {/* off — 비활성(off) 상태일 때 진한 회색으로 강조 */}
      <span
        className="px-2 py-0.5 transition-colors"
        style={{
          background: active ? "var(--bg-panel)" : "var(--border)",
          color: "var(--muted)",
          borderRight: "1px solid var(--border)",
        }}
      >
        off
      </span>
      {/* on — 활성화 시에만 accent 색상 */}
      <span
        className="px-2 py-0.5 transition-colors"
        style={{
          background: active ? accentVar : "var(--bg-panel)",
          color: active ? "var(--bg)" : "var(--muted)",
        }}
      >
        on
      </span>
    </button>
  );
}
