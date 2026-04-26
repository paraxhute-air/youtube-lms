"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteVideoLog } from "@/app/dashboard/actions";
import type { Database } from "@/lib/types/database";

type VideoLog = Database["public"]["Tables"]["video_logs"]["Row"];

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  todo:  { label: "todo",     color: "var(--muted)" },
  doing: { label: "watching", color: "var(--accent-3)" },
  done:  { label: "completed", color: "var(--accent)" },
};

export function VideoList({ logs: initialLogs }: { logs: VideoLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deleteVideoLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    });
  }

  if (logs.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <p className="text-[var(--muted)] text-sm">$ 기록이 없습니다</p>
        <Link href="/watch-learn" className="text-[var(--accent)] text-xs mt-2 block hover:underline">
          watch & learn에서 영상을 찾아보세요 →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {logs.map((log, idx) => {
        const s = STATUS_STYLE[log.status] ?? STATUS_STYLE.todo;
        const mins = Math.floor(log.last_position / 60);
        const secs = Math.floor(log.last_position % 60);

        return (
          <div
            key={log.id}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              background: idx % 2 === 0 ? "var(--bg-panel)" : "var(--bg)",
              borderBottom: idx < logs.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            {/* 썸네일 + 영상 링크 */}
            <Link
              href={`/watch/${log.video_id}`}
              className="flex items-center gap-4 flex-1 min-w-0 group"
            >
              <img
                src={`https://img.youtube.com/vi/${log.video_id}/mqdefault.jpg`}
                alt=""
                className="w-20 h-12 object-cover rounded shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[var(--fg)] text-sm truncate font-medium group-hover:text-[var(--accent)] transition-colors">
                  {log.video_id}
                </p>
                <p className="text-[var(--muted)] text-xs mt-0.5">
                  마지막 위치: {mins}:{secs.toString().padStart(2, "0")}
                </p>
              </div>
            </Link>

            {/* 상태 배지 */}
            <span
              className="text-xs px-2 py-0.5 rounded shrink-0"
              style={{
                color: s.color,
                background: `${s.color}22`,
                border: `1px solid ${s.color}44`,
              }}
            >
              {s.label}
            </span>

            {/* 삭제 버튼 */}
            <button
              onClick={(e) => handleDelete(log.id, e)}
              disabled={isPending}
              title="기록 삭제"
              className="shrink-0 text-xs transition-colors hover:text-[var(--danger)] disabled:opacity-30"
              style={{ color: "var(--muted)" }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
