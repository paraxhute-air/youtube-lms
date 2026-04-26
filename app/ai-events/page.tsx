import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";

const EVENT_CATEGORIES = [
  {
    key: "conference",
    label: "행사 / 컨퍼런스",
    prefix: "$ conf",
    color: "var(--accent)",
    items: [
      { name: "AI Summit Korea 2025", date: "2025.09.15", location: "서울 코엑스", url: "#" },
      { name: "Google I/O Extended Seoul", date: "2025.08.20", location: "서울 강남", url: "#" },
      { name: "DEVIEW 2025", date: "2025.10.08", location: "서울 그랜드 인터컨티넨탈", url: "#" },
    ],
  },
  {
    key: "meetup",
    label: "밋업",
    prefix: "$ meetup",
    color: "var(--accent-2)",
    items: [
      { name: "AI 개발자 밋업 #42", date: "2025.07.18", location: "선릉 토스 오피스", url: "#" },
      { name: "LLM 실전 활용 밋업", date: "2025.08.05", location: "판교 카카오 오피스", url: "#" },
      { name: "RAG & 에이전트 밋업", date: "2025.08.22", location: "강남 패스트파이브", url: "#" },
    ],
  },
  {
    key: "seminar",
    label: "세미나",
    prefix: "$ seminar",
    color: "var(--accent-3)",
    items: [
      { name: "생성형 AI 비즈니스 적용 세미나", date: "2025.07.24", location: "온라인 (Zoom)", url: "#" },
      { name: "AI 규제 & 윤리 세미나", date: "2025.08.12", location: "서울대 관악캠퍼스", url: "#" },
      { name: "멀티모달 AI 최신 동향", date: "2025.09.03", location: "연세대 신촌캠퍼스", url: "#" },
    ],
  },
  {
    key: "workshop",
    label: "워크샵",
    prefix: "$ workshop",
    color: "var(--warn)",
    items: [
      { name: "LangChain 실습 워크샵", date: "2025.07.26", location: "강남 WeWork", url: "#" },
      { name: "파인튜닝 핸즈온 워크샵", date: "2025.08.09", location: "판교 NAVER 1784", url: "#" },
      { name: "AI 프롬프트 엔지니어링 워크샵", date: "2025.09.13", location: "온라인 (Google Meet)", url: "#" },
    ],
  },
  {
    key: "webinar",
    label: "웨비나",
    prefix: "$ webinar",
    color: "var(--danger)",
    items: [
      { name: "Claude API 활용 웨비나", date: "2025.07.30", location: "온라인", url: "#" },
      { name: "OpenAI DevDay 2025 리캡 웨비나", date: "2025.08.14", location: "온라인", url: "#" },
      { name: "AI 스타트업 투자 트렌드 웨비나", date: "2025.09.17", location: "온라인 (YouTube Live)", url: "#" },
    ],
  },
];

export default async function AiEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "user";

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={displayName} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-[var(--accent)] font-bold text-lg">
              <span className="text-[var(--muted)]">$ </span>ai events
            </h1>
            <p className="text-[var(--muted)] text-xs mt-1">행사 · 밋업 · 세미나 · 워크샵 · 웨비나</p>
          </div>

          {EVENT_CATEGORIES.map((cat) => (
            <section key={cat.key}>
              <h2
                className="text-sm font-medium mb-3"
                style={{ color: cat.color }}
              >
                <span className="text-[var(--muted)]">▸ </span>{cat.label}
              </h2>
              <div className="space-y-2">
                {cat.items.map((ev) => (
                  <a
                    key={ev.name}
                    href={ev.url}
                    className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group"
                    style={{
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>▸</span>
                      <span
                        className="text-sm truncate group-hover:text-[var(--accent)] transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        {ev.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{ev.location}</span>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{
                          background: "var(--bg-hover)",
                          color: cat.color,
                          border: `1px solid var(--border)`,
                        }}
                      >
                        {ev.date}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
