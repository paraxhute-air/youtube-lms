import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { YoutubePlayer } from "@/components/player/YoutubePlayer";
import { Sidebar } from "@/components/layout/Sidebar";
import type { VideoStatus } from "@/lib/types/database";

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ cc?: string }>;
}) {
  const { videoId } = await params;
  const { cc } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "user";

  const { data: log } = await supabase
    .from("video_logs")
    .select("last_position, status, watch_seconds")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

  const initialPosition = log?.last_position ?? 0;
  const initialStatus: VideoStatus = (log?.status as VideoStatus) ?? "todo";

  const STATUS_LABEL: Record<VideoStatus, string> = {
    todo: "미시청",
    doing: "시청 중",
    done: "완료",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={displayName} />
      <main className="flex-1 p-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-4">
          <p className="text-[var(--muted)] text-xs">
            <span className="text-[var(--accent)]">▸</span> watch /{videoId}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                color:
                  initialStatus === "done"
                    ? "var(--accent)"
                    : initialStatus === "doing"
                      ? "var(--accent-3)"
                      : "var(--muted)",
                background:
                  initialStatus === "done"
                    ? "var(--accent)22"
                    : initialStatus === "doing"
                      ? "var(--accent-3)22"
                      : "var(--muted)22",
                border: `1px solid ${
                  initialStatus === "done"
                    ? "var(--accent)44"
                    : initialStatus === "doing"
                      ? "var(--accent-3)44"
                      : "var(--muted)44"
                }`,
              }}
            >
              {STATUS_LABEL[initialStatus]}
            </span>
            {initialPosition > 0 && (
              <span className="text-[var(--muted)] text-xs">
                이어보기: {Math.floor(initialPosition / 60)}분{" "}
                {Math.floor(initialPosition % 60)}초 부터
              </span>
            )}
          </div>
        </div>

        <YoutubePlayer
          videoId={videoId}
          userId={user.id}
          initialPosition={initialPosition}
          initialStatus={initialStatus}
          initialWatchSeconds={log?.watch_seconds ?? 0}
          koreanSubtitles={cc === "ko"}
        />

        {/* 안내 */}
        <div
          className="mt-4 px-4 py-3 rounded text-xs"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <span className="text-[var(--accent)]">i</span> 영상의 80% 이상
          시청 시 자동으로 완료 처리됩니다. 진도는 실시간으로 저장됩니다.
        </div>
      </main>
    </div>
  );
}
