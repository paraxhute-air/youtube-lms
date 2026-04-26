"use client";

interface Props {
  keywords: string[];
  selected: string;
  onSelect: (k: string) => void;
}

export function KeywordFilter({ keywords, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <button
          key={k}
          onClick={() => onSelect(k)}
          className="px-3 py-1 rounded text-xs font-medium transition-all"
          style={{
            background: selected === k ? "var(--accent)" : "var(--bg-hover)",
            color: selected === k ? "var(--bg)" : "var(--muted)",
            border: `1px solid ${selected === k ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          {selected === k && "▸ "}
          {k}
        </button>
      ))}
    </div>
  );
}
