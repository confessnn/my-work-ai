"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessagesSquare,
  Calculator,
  Landmark,
  Sheet,
  Brush,
  Settings,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Sun,
  Moon,
  Upload,
  FileText,
  Check,
  Send,
  Clock3,
  ChevronRight,
  PanelLeftClose,
  CircleHelp,
} from "lucide-react";

export const sections = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
    sub: "오늘의 업무를 한눈에",
  },
  {
    id: "chat",
    label: "AI 채팅",
    icon: MessagesSquare,
    sub: "생각을 정리하는 업무 파트너",
  },
  {
    id: "cost",
    label: "원가분석",
    icon: Calculator,
    sub: "견적부터 원가 검토까지",
  },
  {
    id: "procurement",
    label: "공공조달",
    icon: Landmark,
    sub: "우리 회사에 맞는 공고 찾기",
  },
  { id: "excel", label: "엑셀", icon: Sheet, sub: "복잡한 데이터를 명확하게" },
  { id: "cleaning", label: "청소업", icon: Brush, sub: "현장 업무를 꼼꼼하게" },
  {
    id: "settings",
    label: "설정",
    icon: Settings,
    sub: "나에게 맞는 업무 환경",
  },
];
const href = (id: string) => (id === "dashboard" ? "/" : `/${id}`);
const jobs = [
  {
    title: "사무실 정기 청소 견적 검토",
    type: "원가분석",
    section: "cost",
    date: "오늘 10:32",
    status: "검토 완료",
  },
  {
    title: "10월 소모품 구매 내역",
    type: "엑셀",
    section: "excel",
    date: "오늘 09:15",
    status: "분석 완료",
  },
  {
    title: "공공기관 청소 용역 공고",
    type: "공공조달",
    section: "procurement",
    date: "어제 16:40",
    status: "확인 필요",
  },
];
const notices = ["1169", "2609", "3612", "9999"].map((code, i) => ({
  code,
  title: [
    "청사 정기 청소 용역",
    "시설 유지관리 용역",
    "환경 정비 사업",
    "사무공간 종합 관리",
  ][i],
  org: ["서울시 공공기관", "경기 공공시설", "인천 공공기관", "부산 공공시설"][
    i
  ],
}));

function UploadBox({ kind }: { kind: "cost" | "excel" | "manual" }) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const accept = kind === "excel" ? ".xlsx,.xls,.csv" : ".pdf,.xlsx,.xls,.csv";
  return (
    <div className="panel">
      <label className="upload">
        <span className="upload-icon">
          <Upload size={24} />
        </span>
        <strong>
          {kind === "manual"
            ? "제조사 매뉴얼을 등록하세요"
            : "분석할 파일을 선택하세요"}
        </strong>
        <span>{accept} · 최대 20MB</span>
        <span className="button secondary">파일 선택</span>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            if (
              selected.some(
                (f) =>
                  f.size > 20 * 1024 * 1024 ||
                  !accept
                    .split(",")
                    .some((ext) => f.name.toLowerCase().endsWith(ext)),
              )
            ) {
              setError("지원 형식과 파일 크기(20MB)를 확인하세요.");
              return;
            }
            setError("");
            setFiles((old) => [...old, ...selected.map((f) => f.name)]);
            e.target.value = "";
          }}
        />
        <small>
          파일명만 현재 화면에 보관합니다. 전송·내용 분석은 수행하지 않습니다.
        </small>
      </label>
      <p role="alert">{error}</p>
      {files.map((f, i) => (
        <div className="file-row" key={`${f}-${i}`}>
          <FileText size={18} />
          <span>{f}</span>
          <button onClick={() => setFiles(files.filter((_, n) => n !== i))}>
            제거
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Workspace({ section }: { section: string }) {
  const current = sections.find((s) => s.id === section)!;
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("전체");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const [checks, setChecks] = useState<string[]>([]);
  const [name, setName] = useState("사용자");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("mywork-theme");
    document.documentElement.dataset.theme = stored ?? "light";
    // Restore browser preferences after hydration, keeping the server render deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(stored === "dark");
    setName(localStorage.getItem("mywork-name") || "사용자");
  }, []);
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("mywork-theme", next ? "dark" : "light");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Sparkles size={21} />
          </span>
          My Work <b>AI</b>
        </Link>
        <div className="workspace-label">
          WORKSPACE <PanelLeftClose size={15} />
        </div>
        <nav aria-label="주 메뉴">
          {sections.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={href(id)}
              className={`nav-item ${section === id ? "active" : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "chat" && <span className="mini-badge">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="assistant-card">
            <Sparkles size={20} />
            <strong>더 가볍게, 더 스마트하게</strong>
            <p>매일의 업무에 AI를 더하세요.</p>
            <Link href="/chat">
              AI 비서 시작하기 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="user">
            <span className="avatar">M</span>
            <div>
              <strong>내 워크스페이스</strong>
              <small>개인 업무 공간</small>
            </div>
            <Settings size={16} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            워크스페이스 <ChevronRight size={14} />
            <strong>{current.label}</strong>
          </div>
          <div>
            <span className="demo-pill">예시 모드</span>
            <button
              className="icon-button"
              aria-label="화면 테마 전환"
              onClick={toggleTheme}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="avatar small">M</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">MY WORKSPACE</p>
              <h1>
                {section === "dashboard" ? "좋은 하루예요 👋" : current.label}
              </h1>
              <p>
                {section === "dashboard"
                  ? "오늘도 My Work AI와 함께, 중요한 일에 집중하세요."
                  : current.sub}
              </p>
            </div>
            <Link className="button primary" href="/chat">
              <Plus size={17} />새 대화 시작
            </Link>
          </div>
          <div className="demo-note">
            <span className="status-dot" />
            현재 예시 데이터를 표시하고 있습니다. 외부 API는 연결되지
            않았습니다.
          </div>
          {section === "dashboard" && (
            <>
              <section className="hero">
                <div>
                  <span className="hero-kicker">
                    <Sparkles size={15} /> 당신의 든든한 업무 파트너
                  </span>
                  <h2>
                    복잡한 업무는 덜고,
                    <br />
                    가능성은 더 넓게.
                  </h2>
                  <p>
                    견적 분석부터 공고 검색, 엑셀 정리까지.
                    <br />
                    흩어진 업무를 하나의 공간에서 시작하세요.
                  </p>
                  <Link className="button hero-button" href="/chat">
                    AI 비서에게 물어보기 <ArrowUpRight size={17} />
                  </Link>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="art-tile tile-sheet">
                    <Sheet size={26} />
                  </div>
                  <div className="art-tile tile-chat">
                    <MessagesSquare size={28} />
                  </div>
                  <div className="art-core">
                    <Sparkles size={55} strokeWidth={1.4} />
                  </div>
                  <div className="art-tile tile-calc">
                    <Calculator size={26} />
                  </div>
                  <span className="art-star">✦</span>
                </div>
              </section>
              <section>
                <div className="section-heading">
                  <h2>어떤 업무를 도와드릴까요?</h2>
                  <span>자주 사용하는 업무</span>
                </div>
                <div className="tool-grid">
                  {sections
                    .slice(1, 6)
                    .map(({ id, label, icon: Icon, sub }) => (
                      <Link
                        className={`tool-card tool-${id}`}
                        href={href(id)}
                        key={id}
                      >
                        <span className="tool-icon">
                          <Icon size={23} />
                        </span>
                        <ArrowUpRight className="card-arrow" size={16} />
                        <h3>{label}</h3>
                        <p>{sub}</p>
                      </Link>
                    ))}
                </div>
              </section>
              <section className="panel recent">
                <div className="section-heading">
                  <h2>
                    최근 작업 <span className="example">예시</span>
                  </h2>
                  <span>작업을 이어서 시작하세요</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>작업명</th>
                        <th>업무</th>
                        <th>최근 수정</th>
                        <th>상태</th>
                        <th>
                          <span className="sr-only">열기</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.title}>
                          <td>
                            <Link href={href(job.section)}>
                              <span className="document-icon">
                                <FileText size={18} />
                              </span>
                              {job.title}{" "}
                              <small className="example">예시</small>
                            </Link>
                          </td>
                          <td>{job.type}</td>
                          <td>
                            <Clock3 size={13} /> {job.date}
                          </td>
                          <td>
                            <span
                              className={`status ${job.status === "확인 필요" ? "pending" : ""}`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={href(job.section)}
                              aria-label={`${job.title} 열기`}
                            >
                              <ChevronRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="tip">
                <span className="tip-icon">
                  <CircleHelp size={20} />
                </span>
                <div>
                  <strong>작은 질문으로 시작해 보세요</strong>
                  <p>
                    “이번 달 지출 내역 정리해 줘”처럼, 평소 사용하는 말로 질문해
                    보세요.
                  </p>
                </div>
                <Link href="/chat">
                  대화 시작 <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
          {section === "chat" && (
            <section className="panel chat">
              <div className="chat-messages" aria-live="polite">
                <div className="chat-welcome">
                  <Sparkles size={36} />
                  <h2>어떤 일을 함께 해볼까요?</h2>
                  <p>예시 응답으로 대화 흐름을 체험하세요.</p>
                </div>
                {messages.map((m, i) => (
                  <div className={`message ${m.role}`} key={i}>
                    <strong>
                      {m.role === "user" ? "나" : "AI 비서 · 예시"}
                    </strong>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  setMessages([
                    ...messages,
                    { role: "user", text: draft.trim() },
                    {
                      role: "assistant",
                      text: "예시 응답입니다. 요청을 받았습니다. 실제 AI 분석은 API 연결 후 이용할 수 있습니다. 지금은 업무별 메뉴에서 화면을 체험해 보세요.",
                    },
                  ]);
                  setDraft("");
                }}
              >
                <input
                  aria-label="메시지"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="업무에 대해 무엇이든 물어보세요"
                  maxLength={4000}
                />
                <button
                  className="button primary"
                  disabled={!draft.trim()}
                  aria-label="메시지 보내기"
                >
                  <Send size={18} />
                </button>
              </form>
            </section>
          )}
          {section === "cost" && (
            <>
              <UploadBox kind="cost" />
              <section className="panel">
                <h2>
                  계산서 목록 <span className="example">예시</span>
                </h2>
                {[
                  "사무실 정기 청소 견적 · 1,250,000원",
                  "시설 소모품 견적 · 380,000원",
                ].map((t) => (
                  <div key={t} className="file-row">
                    <FileText size={20} />
                    <span>{t}</span>
                    <span className="example">예시</span>
                  </div>
                ))}
                <p className="muted">
                  표시 금액은 예시이며 실제 파일에서 계산되지 않았습니다.
                </p>
              </section>
            </>
          )}
          {section === "procurement" && (
            <section className="panel">
              <h2>
                공고 검색 <span className="example">예시</span>
              </h2>
              <label className="search-box">
                <Search size={19} />
                <input
                  aria-label="공고 검색"
                  placeholder="공고명 또는 기관명을 입력하세요"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="filters" aria-label="업종코드 필터">
                {["전체", "1169", "2609", "3612", "9999"].map((c) => (
                  <button
                    aria-pressed={code === c}
                    className={code === c ? "selected" : ""}
                    key={c}
                    onClick={() => setCode(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {notices
                .filter(
                  (n) =>
                    (code === "전체" || n.code === code) &&
                    `${n.title} ${n.org}`.includes(query.trim()),
                )
                .map((n) => (
                  <div key={n.code} className="notice">
                    <div>
                      <span className="example">예시</span>
                      <h3>{n.title}</h3>
                      <p>
                        {n.org} · 업종코드 {n.code}
                      </p>
                    </div>
                    <span className="status">접수 중 · 예시</span>
                  </div>
                ))}
              {!notices.some(
                (n) =>
                  (code === "전체" || n.code === code) &&
                  `${n.title} ${n.org}`.includes(query.trim()),
              ) && <p className="empty">검색 결과가 없습니다.</p>}
            </section>
          )}
          {section === "excel" && (
            <>
              <UploadBox kind="excel" />
              <div className="stats-grid">
                {[
                  ["전체 행", "1,284"],
                  ["총 지출", "₩8,450,000"],
                  ["분류 항목", "12"],
                ].map(([label, value]) => (
                  <div className="panel stat" key={label}>
                    <p>
                      {label} <span className="example">예시</span>
                    </p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <section className="panel">
                <h2>
                  항목별 지출 <span className="example">예시</span>
                </h2>
                {[
                  ["인건비", 60],
                  ["소모품", 25],
                  ["장비", 15],
                ].map(([label, value]) => (
                  <div className="chart-row" key={label}>
                    <span>{label}</span>
                    <div>
                      <span style={{ width: `${value}%` }} />
                    </div>
                    <span>{value}%</span>
                  </div>
                ))}
                <p className="muted">
                  예시 지표입니다. 업로드한 파일과 연동되지 않습니다.
                </p>
              </section>
            </>
          )}
          {section === "cleaning" && (
            <>
              <section className="panel">
                <div className="section-heading">
                  <h2>
                    현장 작업 체크리스트 <span className="example">예시</span>
                  </h2>
                  <span>{checks.length}/4 완료</span>
                </div>
                {[
                  "작업 전 안전 점검",
                  "바닥 및 공용 공간 청소",
                  "소모품 보충",
                  "작업 후 장비 정리",
                ].map((t) => (
                  <label className="check-row" key={t}>
                    <input
                      type="checkbox"
                      checked={checks.includes(t)}
                      onChange={(e) =>
                        setChecks(
                          e.target.checked
                            ? [...checks, t]
                            : checks.filter((c) => c !== t),
                        )
                      }
                    />
                    <span>{t}</span>
                    {checks.includes(t) && <Check size={17} />}
                  </label>
                ))}
                <p className="muted">체크 상태는 현재 화면에서만 유지됩니다.</p>
              </section>
              <h2 className="standalone-heading">제조사 매뉴얼 관리</h2>
              <UploadBox kind="manual" />
            </>
          )}
          {section === "settings" && (
            <>
              <form
                className="panel settings"
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem("mywork-name", name);
                  setSaved(true);
                }}
              >
                <h2>사용자 설정</h2>
                <label>
                  표시 이름
                  <input
                    value={name}
                    maxLength={40}
                    required
                    onChange={(e) => {
                      setName(e.target.value);
                      setSaved(false);
                    }}
                  />
                </label>
                <button
                  className="button secondary"
                  type="button"
                  onClick={toggleTheme}
                >
                  라이트 / 다크모드 전환
                </button>
                <button className="button primary" type="submit">
                  이름 저장
                </button>
                <span role="status">
                  {saved ? "이 브라우저에 저장했습니다." : ""}
                </span>
              </form>
              <section className="panel">
                <h2>외부 API 연결 상태</h2>
                {["AI 모델 API", "공공조달 API", "문서 분석 API"].map((t) => (
                  <div className="file-row" key={t}>
                    <span>{t}</span>
                    <span className="status pending">미연결</span>
                  </div>
                ))}
                <p className="muted">
                  이번 단계에서는 외부 API를 연결하지 않습니다. API 키를 입력할
                  필요가 없습니다.
                </p>
              </section>
            </>
          )}
          <footer>
            <span>My Work AI</span>
            <span>당신의 업무에, 더 나은 흐름을.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="모바일 메뉴">
        {sections.map(({ id, label, icon: Icon }) => (
          <Link
            href={href(id)}
            key={id}
            className={section === id ? "active" : ""}
            aria-current={section === id ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
