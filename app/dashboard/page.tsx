import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LearningChart } from "@/components/dashboard/LearningChart";
import { VideoList } from "@/components/dashboard/VideoList";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";

export const dynamic = "force-dynamic";

function buildMonthlyData(
  logs: { updated_at: string; watch_seconds: number }[],
) {
  const now = new Date();
  const months: { month: string; seconds: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("ko-KR", { month: "short" }),
      seconds: 0,
    });
  }

  for (const log of logs) {
    const d = new Date(log.updated_at);
    const diffMonths =
      (now.getFullYear() - d.getFullYear()) * 12 +
      (now.getMonth() - d.getMonth());
    if (diffMonths >= 0 && diffMonths < 6) {
      months[5 - diffMonths].seconds += log.watch_seconds;
    }
  }

  return months;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: logs } = await supabase
    .from("video_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const allLogs = logs ?? [];
  const monthlyData = buildMonthlyData(allLogs);

  // 일별 활동 집계 (updated_at 기준)
  const activityByDay = new Map<string, number>();
  for (const log of allLogs) {
    const day = (log.updated_at as string).slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
  }
  const activityData = [...activityByDay.entries()].map(([date, count]) => ({ date, count }));

  const totalSeconds = allLogs.reduce((s, l) => s + (l.watch_seconds ?? 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);

  const doingLogs = allLogs.filter((l) => l.status === "doing");
  const doneLogs = allLogs.filter((l) => l.status === "done");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-[var(--accent)] font-bold text-lg">
          <span className="text-[var(--muted)]">$ </span>dashboard
        </h1>
        <p className="text-[var(--muted)] text-xs mt-1">AI 학습 진도 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "총 학습 시간", value: `${totalHours}h ${totalMins}m`, color: "var(--accent)" },
          { label: "watching", value: doingLogs.length, color: "var(--accent-3)" },
          { label: "completed", value: doneLogs.length, color: "var(--accent-2)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-4"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <p className="text-[var(--muted)] text-xs">{stat.label}</p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 월별 그래프 */}
      <LearningChart data={monthlyData} />

      {/* 학습 잔디 */}
      <ActivityHeatmap data={activityData} />

      {/* 시청 중 */}
      <section>
        <h2 className="text-[var(--accent-3)] text-sm font-medium mb-2">
          <span className="text-[var(--muted)]">▸ </span>watching
        </h2>
        <VideoList logs={doingLogs} />
      </section>

      {/* 완료 */}
      <section>
        <h2 className="text-[var(--accent-2)] text-sm font-medium mb-2">
          <span className="text-[var(--muted)]">▸ </span>completed
        </h2>
        <VideoList logs={doneLogs} />
      </section>
    </div>
  );
}
