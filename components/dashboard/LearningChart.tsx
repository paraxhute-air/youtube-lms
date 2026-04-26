"use client";

type MonthlyData = { month: string; seconds: number };

export function LearningChart({ data }: { data: MonthlyData[] }) {
  const max = Math.max(...data.map((d) => d.seconds), 1);

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      <p className="text-[var(--muted)] text-xs mb-4">
        <span className="text-[var(--accent)]">▸</span> monthly_watch_time
      </p>

      <div className="flex items-end gap-2 h-32">
        {data.map((d) => {
          const heightPct = (d.seconds / max) * 100;
          const hours = Math.floor(d.seconds / 3600);
          const mins = Math.floor((d.seconds % 3600) / 60);
          return (
            <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
              <div className="relative w-full group">
                {/* 툴팁 */}
                <div
                  className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "var(--bg-hover)", color: "var(--fg)", border: "1px solid var(--border)" }}
                >
                  {hours}h {mins}m
                </div>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    minHeight: "4px",
                    maxHeight: "100%",
                    background: d.seconds > 0 ? "var(--accent)" : "var(--border)",
                  }}
                />
              </div>
              <span className="text-[var(--muted)] text-xs">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
