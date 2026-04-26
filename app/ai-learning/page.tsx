import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";

const BOOTCAMPS = [
  {
    name: "AI 풀스택 부트캠프 (국비지원)",
    org: "멀티캠퍼스",
    duration: "6개월",
    type: "국비지원",
    url: "#",
  },
  {
    name: "머신러닝·딥러닝 실전 과정 (국비지원)",
    org: "패스트캠퍼스 스쿨",
    duration: "5개월",
    type: "국비지원",
    url: "#",
  },
  {
    name: "LLM 엔지니어 양성 과정",
    org: "코드스테이츠",
    duration: "4개월",
    type: "장기",
    url: "#",
  },
  {
    name: "생성형 AI 실무 단기 집중",
    org: "스파르타코딩클럽",
    duration: "8주",
    type: "단기",
    url: "#",
  },
  {
    name: "AI 서비스 기획·개발 부트캠프 (국비지원)",
    org: "네이버 커넥트재단 부스트캠프",
    duration: "5개월",
    type: "국비지원",
    url: "#",
  },
];

const VOD_COURSES = [
  {
    title: "ChatGPT & LangChain으로 AI 서비스 만들기",
    platform: "패스트캠퍼스",
    instructor: "박민준",
    url: "#",
  },
  {
    title: "딥러닝 완전정복 (PyTorch)",
    platform: "인프런",
    instructor: "김성훈",
    url: "#",
  },
  {
    title: "RAG 기반 AI 챗봇 구축 실전",
    platform: "패스트캠퍼스",
    instructor: "이지은",
    url: "#",
  },
  {
    title: "프롬프트 엔지니어링 A to Z",
    platform: "인프런",
    instructor: "최현준",
    url: "#",
  },
  {
    title: "Hugging Face로 NLP 파인튜닝",
    platform: "인프런",
    instructor: "안재현",
    url: "#",
  },
  {
    title: "AI 기반 사이드 프로젝트 설계와 배포",
    platform: "패스트캠퍼스",
    instructor: "정다운",
    url: "#",
  },
];

const BOOKS = [
  {
    title: "밑바닥부터 시작하는 딥러닝 4",
    author: "사이토 고키",
    publisher: "한빛미디어",
    url: "#",
  },
  {
    title: "랭체인으로 LLM 기반 AI 서비스 개발하기",
    author: "서지영",
    publisher: "위키북스",
    url: "#",
  },
  {
    title: "파이썬으로 배우는 머신러닝의 교과서",
    author: "이시카와 슌",
    publisher: "길벗",
    url: "#",
  },
  {
    title: "AI 엔지니어링",
    author: "Chip Huyen",
    publisher: "한빛미디어",
    url: "#",
  },
  {
    title: "프롬프트 엔지니어링 가이드",
    author: "Elvis Saravia",
    publisher: "제이펍",
    url: "#",
  },
];

const TYPE_COLOR: Record<string, string> = {
  "국비지원": "var(--accent-2)",
  "장기": "var(--accent-3)",
  "단기": "var(--warn)",
};

const PLATFORM_COLOR: Record<string, string> = {
  "패스트캠퍼스": "var(--accent-3)",
  "인프런": "var(--accent-2)",
};

export default async function AiLearningPage() {
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
        <div className="max-w-4xl mx-auto space-y-10">
          <div>
            <h1 className="text-[var(--accent)] font-bold text-lg">
              <span className="text-[var(--muted)]">$ </span>ai learning
            </h1>
            <p className="text-[var(--muted)] text-xs mt-1">부트캠프 · VOD · 서적</p>
          </div>

          {/* 1. 부트캠프 / 국비지원 */}
          <section>
            <h2 className="text-sm font-medium mb-1" style={{ color: "var(--accent)" }}>
              <span className="text-[var(--muted)]">▸ </span>부트캠프 / 국비지원 교육과정
            </h2>
            <p className="text-[var(--muted)] text-xs mb-3 ml-4">
              장기·단기·국비지원 오프라인·온라인 교육과정
            </p>
            <div className="space-y-2">
              {BOOTCAMPS.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>▸</span>
                    <div className="min-w-0">
                      <p
                        className="text-sm truncate group-hover:text-[var(--accent)] transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.org}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{item.duration}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "var(--bg-hover)",
                        color: TYPE_COLOR[item.type] ?? "var(--muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* 2. VOD 컨텐츠 */}
          <section>
            <h2 className="text-sm font-medium mb-1" style={{ color: "var(--accent-2)" }}>
              <span className="text-[var(--muted)]">▸ </span>VOD 컨텐츠
            </h2>
            <p className="text-[var(--muted)] text-xs mb-3 ml-4">
              패스트캠퍼스 · 인프런 등 온라인 강의
            </p>
            <div className="space-y-2">
              {VOD_COURSES.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>▸</span>
                    <div className="min-w-0">
                      <p
                        className="text-sm truncate group-hover:text-[var(--accent-2)] transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.instructor}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded shrink-0 ml-4"
                    style={{
                      background: "var(--bg-hover)",
                      color: PLATFORM_COLOR[item.platform] ?? "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {item.platform}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* 3. 서적 */}
          <section>
            <h2 className="text-sm font-medium mb-1" style={{ color: "var(--accent-3)" }}>
              <span className="text-[var(--muted)]">▸ </span>서적
            </h2>
            <p className="text-[var(--muted)] text-xs mb-3 ml-4">
              AI·ML·LLM 관련 추천 도서
            </p>
            <div className="space-y-2">
              {BOOKS.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>▸</span>
                    <div className="min-w-0">
                      <p
                        className="text-sm truncate group-hover:text-[var(--accent-3)] transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.author}</p>
                    </div>
                  </div>
                  <span className="text-xs shrink-0 ml-4" style={{ color: "var(--muted)" }}>
                    {item.publisher}
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
