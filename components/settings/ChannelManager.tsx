"use client";

import { useState, useTransition } from "react";
import {
  addChannel,
  deleteChannel,
  toggleChannel,
  reorderChannel,
} from "@/app/settings/channels/actions";
import { Toggle } from "@/components/ui/Toggle";
import type { Database } from "@/lib/types/database";

type Channel = Database["public"]["Tables"]["search_channels"]["Row"];

export function ChannelManager({ initialChannels }: { initialChannels: Channel[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [newUrl, setNewUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleAdd() {
    const url = newUrl.trim();
    if (!url) return;
    setError(null);
    startTransition(async () => {
      const result = await addChannel(url);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setChannels((prev) => [...prev, result.data!]);
        setNewUrl("");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      await toggleChannel(id, next);
      setChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: next } : c)),
      );
    });
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      return;
    }
    const next = [...channels];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, removed);
    setChannels(next);
    setDragIdx(null);
    startTransition(async () => {
      await Promise.all(next.map((c, i) => reorderChannel(c.id, i * 10)));
    });
  }

  return (
    <div className="space-y-4">
      {/* 추가 폼 */}
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <p className="text-[var(--muted)] text-xs mb-1">
          <span className="text-[var(--accent-2)]">▸</span> add_channel
        </p>
        <p className="text-[var(--muted)] text-xs mb-3">
          예: https://www.youtube.com/@anthropic 또는 @anthropic
        </p>
        <div className="flex gap-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="채널 URL 또는 @핸들"
            disabled={isPending}
            className="flex-1 px-3 py-2 rounded text-sm outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newUrl.trim()}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--accent-2)", color: "var(--bg)" }}
          >
            {isPending ? "확인 중..." : "추가"}
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
            ✗ {error}
          </p>
        )}
      </div>

      {/* 채널 목록 */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <span className="text-[var(--accent-2)]">▸</span> channels ({channels.length})
        </div>

        {channels.length === 0 ? (
          <div
            className="px-4 py-8 text-center text-sm"
            style={{ background: "var(--bg)", color: "var(--muted)" }}
          >
            등록된 채널이 없습니다
          </div>
        ) : (
          channels.map((ch, idx) => (
            <div
              key={ch.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragIdx(null)}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: idx % 2 === 0 ? "var(--bg)" : "var(--bg-panel)",
                borderBottom: idx < channels.length - 1 ? "1px solid var(--border)" : "none",
                opacity: dragIdx === idx ? 0.4 : (ch.is_active ? 1 : 0.5),
                cursor: "grab",
              }}
            >
              {/* 드래그 핸들 */}
              <span
                className="text-sm select-none shrink-0"
                style={{ color: "var(--border)", cursor: "grab" }}
              >
                ⠿
              </span>

              {/* 채널 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                  {ch.channel_name ?? ch.channel_url}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {ch.channel_url}
                </p>
              </div>

              {/* on/off 토글 */}
              <Toggle
                active={ch.is_active}
                onChange={(v) => handleToggle(ch.id, v)}
                disabled={isPending}
                accentVar="var(--accent-2)"
              />

              {/* 삭제 */}
              <div className="relative shrink-0">
                {confirmId === ch.id && (
                  <div
                    className="absolute bottom-full right-0 mb-1.5 px-3 py-2 rounded text-xs whitespace-nowrap z-10 flex items-center gap-2"
                    style={{
                      background: "var(--bg-panel)",
                      border: "1px solid var(--danger)",
                      color: "var(--fg)",
                    }}
                  >
                    삭제할까요?
                    <button
                      onClick={() => { setConfirmId(null); handleDelete(ch.id); }}
                      className="font-medium"
                      style={{ color: "var(--danger)" }}
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{ color: "var(--muted)" }}
                    >
                      취소
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setConfirmId(ch.id)}
                  disabled={isPending}
                  className="text-xs transition-colors hover:text-[var(--danger)]"
                  style={{ color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
