"use client";

import { useState, useTransition } from "react";
import {
  addKeyword,
  deleteKeyword,
  toggleKeyword,
  reorderKeyword,
} from "@/app/settings/keywords/actions";
import { Toggle } from "@/components/ui/Toggle";
import type { Database } from "@/lib/types/database";

type Keyword = Database["public"]["Tables"]["search_keywords"]["Row"];

export function KeywordManager({
  initialKeywords,
}: {
  initialKeywords: Keyword[];
}) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKw, setNewKw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleAdd() {
    const kw = newKw.trim();
    if (!kw) return;
    if (keywords.some((k) => k.keyword.toLowerCase() === kw.toLowerCase())) {
      setError("이미 존재하는 키워드입니다");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addKeyword(kw);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setKeywords((prev) => [...prev, result.data!]);
        setNewKw("");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    });
  }

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      await toggleKeyword(id, next);
      setKeywords((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: next } : k)),
      );
    });
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      return;
    }
    const next = [...keywords];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, removed);
    setKeywords(next);
    setDragIdx(null);
    startTransition(async () => {
      await Promise.all(next.map((k, i) => reorderKeyword(k.id, i * 10)));
    });
  }

  return (
    <div className="space-y-4">
      {/* 추가 폼 */}
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <p className="text-[var(--muted)] text-xs mb-3">
          <span className="text-[var(--accent)]">▸</span> add_keyword
        </p>
        <div className="flex gap-2">
          <input
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="예: Claude AI"
            disabled={isPending}
            className="flex-1 px-3 py-2 rounded text-sm bg-transparent outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newKw.trim()}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
            }}
          >
            추가
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
            ✗ {error}
          </p>
        )}
      </div>

      {/* 키워드 목록 */}
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
          <span className="text-[var(--accent)]">▸</span> keywords ({keywords.length})
        </div>

        {keywords.length === 0 ? (
          <div
            className="px-4 py-8 text-center text-sm"
            style={{ background: "var(--bg)", color: "var(--muted)" }}
          >
            등록된 키워드가 없습니다
          </div>
        ) : (
          keywords.map((kw, idx) => (
            <div
              key={kw.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragIdx(null)}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: idx % 2 === 0 ? "var(--bg)" : "var(--bg-panel)",
                borderBottom: idx < keywords.length - 1 ? "1px solid var(--border)" : "none",
                opacity: dragIdx === idx ? 0.4 : (kw.is_active ? 1 : 0.5),
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

              {/* 키워드 */}
              <span className="flex-1 text-sm" style={{ color: "var(--fg)" }}>
                {kw.keyword}
              </span>

              {/* on/off 토글 */}
              <Toggle
                active={kw.is_active}
                onChange={(v) => handleToggle(kw.id, v)}
                disabled={isPending}
              />

              {/* 삭제 */}
              <div className="relative">
                {confirmId === kw.id && (
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
                      onClick={() => { setConfirmId(null); handleDelete(kw.id); }}
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
                  onClick={() => setConfirmId(kw.id)}
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
