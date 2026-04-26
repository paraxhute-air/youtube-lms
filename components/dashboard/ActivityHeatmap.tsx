"use client";

import { useMemo } from "react";

interface DayData {
  date: string; // YYYY-MM-DD
  count: number;
}

function getLevel(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const COLORS = [
  "var(--bg-hover)",
  "color-mix(in srgb, var(--accent) 25%, var(--bg-hover))",
  "color-mix(in srgb, var(--accent) 45%, var(--bg-hover))",
  "color-mix(in srgb, var(--accent) 72%, var(--bg-hover))",
  "var(--accent)",
];

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

const CELL = 11;
const GAP  = 2;

function toStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export function ActivityHeatmap({ data }: { data: DayData[] }) {
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { date, count } of data) map.set(date, count);
    return map;
  }, [data]);

  // 52주 + 현재 주 (최대 53컬럼)
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayDow = (today.getDay() + 6) % 7; // Mon=0

    const start = new Date(today);
    start.setDate(today.getDate() - todayDow - 51 * 7);
    start.setHours(0, 0, 0, 0);

    const result: Date[][] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const week: Date[] = [];
      for (let d = 0; d < 7 && cur <= today; d++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, []);

  // 월 이름 레이블 (컬럼 인덱스 → 월 이름)
  const monthLabels = useMemo(() => {
    const map = new Map<number, string>();
    weeks.forEach((week, col) => {
      const first = week[0];
      const prev = weeks[col - 1]?.[0];
      if (!prev || first.getMonth() !== prev.getMonth()) {
        map.set(col, first.toLocaleString("ko-KR", { month: "short" }));
      }
    });
    return map;
  }, [weeks]);

  const totalActiveDays = useMemo(
    () => [...activityMap.values()].filter((v) => v > 0).length,
    [activityMap],
  );

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          <span style={{ color: "var(--accent)" }}>▸</span> activity
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          지난 1년 중{" "}
          <span style={{ color: "var(--accent)" }}>{totalActiveDays}</span>일 학습
        </p>
      </div>

      {/* 그리드 */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-flex", gap: `${GAP}px`, alignItems: "flex-start" }}>

          {/* 요일 레이블 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${GAP}px`,
              marginTop: `${CELL + GAP + 4}px`,
              marginRight: "2px",
            }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  width: "22px",
                  height: `${CELL}px`,
                  fontSize: "9px",
                  lineHeight: `${CELL}px`,
                  color: "var(--muted)",
                  textAlign: "right",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 주 컬럼 묶음 */}
          <div>
            {/* 월 레이블 행 */}
            <div style={{ display: "flex", gap: `${GAP}px`, marginBottom: "4px" }}>
              {weeks.map((_, col) => (
                <div
                  key={col}
                  style={{
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    fontSize: "9px",
                    color: "var(--muted)",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                    lineHeight: `${CELL}px`,
                  }}
                >
                  {monthLabels.get(col) ?? ""}
                </div>
              ))}
            </div>

            {/* 셀 행들 */}
            <div style={{ display: "flex", gap: `${GAP}px` }}>
              {weeks.map((week, col) => (
                <div
                  key={col}
                  style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}
                >
                  {week.map((date) => {
                    const str = toStr(date);
                    const count = activityMap.get(str) ?? 0;
                    return (
                      <div
                        key={str}
                        title={`${str}: ${count}편 시청`}
                        style={{
                          width: `${CELL}px`,
                          height: `${CELL}px`,
                          borderRadius: "2px",
                          background: COLORS[getLevel(count)],
                          cursor: "default",
                        }}
                      />
                    );
                  })}
                  {/* 현재 주 빈 칸 패딩 */}
                  {Array.from({ length: 7 - week.length }).map((_, i) => (
                    <div key={`p${i}`} style={{ width: `${CELL}px`, height: `${CELL}px` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "9px", color: "var(--muted)" }}>적음</span>
        {COLORS.map((c, i) => (
          <div
            key={i}
            style={{ width: `${CELL}px`, height: `${CELL}px`, borderRadius: "2px", background: c }}
          />
        ))}
        <span style={{ fontSize: "9px", color: "var(--muted)" }}>많음</span>
      </div>
    </div>
  );
}
