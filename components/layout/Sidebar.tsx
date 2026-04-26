"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

const NAV_ITEMS = [
  { href: "/dashboard", label: "dashboard", icon: "▸" },
  { href: "/curation", label: "curation",  icon: "▸" },
];

export function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-56 h-screen sticky top-0 overflow-y-auto px-4 py-5 shrink-0"
      style={{ background: "var(--bg-panel)", borderRight: "1px solid var(--border)" }}
    >
      {/* 터미널 제목 */}
      <div className="mb-6">
        <p className="text-[var(--accent)] font-bold text-sm tracking-widest">YT-LMS</p>
        <p className="text-[var(--muted)] text-xs mt-0.5">~ /{displayName}</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
              style={{
                background: active ? "var(--bg-hover)" : "transparent",
                color: active ? "var(--accent)" : "var(--muted)",
              }}
            >
              <span className={active ? "text-[var(--accent)]" : "text-[var(--border)]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div
          className="mt-2 pt-3 space-y-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="px-3 text-xs" style={{ color: "var(--muted)" }}>settings</p>
          {[
            { href: "/settings/keywords", label: "keywords" },
            { href: "/settings/channels", label: "channels" },
          ].map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ml-2"
                style={{
                  background: active ? "var(--bg-hover)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                }}
              >
                <span style={{ color: active ? "var(--accent)" : "var(--border)" }}>▸</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 하단 */}
      <div className="space-y-3">
        <ThemeSwitcher />
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="text-xs transition-colors hover:text-[var(--danger)]"
            style={{ color: "var(--muted)" }}
          >
            $ logout
          </button>
        </form>
      </div>
    </aside>
  );
}
