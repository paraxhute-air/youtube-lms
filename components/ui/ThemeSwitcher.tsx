"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

const THEMES = [
  // ── Dark ──────────────────────────────────
  { id: "monokai",         label: "Monokai",         dark: true  },
  { id: "dracula",         label: "Dracula",          dark: true  },
  { id: "solarized-dark",  label: "Solarized Dark",   dark: true  },
  { id: "one-dark",        label: "One Dark",         dark: true  },
  { id: "claude",          label: "Claude Dark",      dark: true  },
  { id: "github-dark",     label: "GitHub Dark",      dark: true  },
  // ── Light ─────────────────────────────────
  { id: "claude-light",    label: "Claude Light",     dark: false },
  { id: "github-light",    label: "GitHub Light",     dark: false },
  { id: "solarized-light", label: "Solarized Light",  dark: false },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!mounted) return null;

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const darkThemes  = THEMES.filter((t) => t.dark);
  const lightThemes = THEMES.filter((t) => !t.dark);

  return (
    <div className="relative" ref={ref}>
      <span className="text-[var(--muted)] text-xs block mb-1">theme</span>

      {/* 선택된 테마 표시 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors"
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      >
        <span>{current.label}</span>
        <span
          className="text-[var(--muted)] transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-full rounded overflow-hidden z-50"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {/* Dark 그룹 */}
          <div
            className="px-2 pt-2 pb-0.5 text-[10px] tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            DARK
          </div>
          {darkThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors"
              style={{
                background: theme === t.id ? "var(--bg-hover)" : "transparent",
                color: theme === t.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {theme === t.id && <span className="mr-1.5">▸</span>}
              {t.label}
            </button>
          ))}

          {/* Light 그룹 */}
          <div
            className="px-2 pt-2 pb-0.5 text-[10px] tracking-widest"
            style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
          >
            LIGHT
          </div>
          {lightThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors"
              style={{
                background: theme === t.id ? "var(--bg-hover)" : "transparent",
                color: theme === t.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {theme === t.id && <span className="mr-1.5">▸</span>}
              {t.label}
            </button>
          ))}
          <div className="pb-1" />
        </div>
      )}
    </div>
  );
}
