"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Send, Sparkles } from "lucide-react";
import {
  conversationInput,
  MAX_MESSAGE_CHARS,
  modes,
  type ChatMessage,
  type ChatMode,
} from "@/lib/chat/types";

export function ConnectionStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/chat", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (typeof data.configured !== "boolean") throw new Error();
        setConfigured(data.configured);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="connection-status" role="status">
      {failed
        ? "연결 설정 확인 실패 · 잠시 후 새로고침하세요."
        : configured === null
          ? "OpenAI 연결 설정 확인 중…"
          : configured
            ? "OpenAI 키 설정됨 · 실제 연결은 메시지 전송 시 확인됩니다."
            : "OpenAI 미연결 · 서버의 .env.local에 OPENAI_API_KEY를 설정한 뒤 서버를 재시작하세요. 키를 채팅에 입력하지 마세요."}
    </div>
  );
}

export default function Chat() {
  const [mode, setMode] = useState<ChatMode>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending, error]);

  async function send() {
    const content = draft.trim();
    if (busy.current || !content) return;
    if (content.length > MAX_MESSAGE_CHARS) {
      setError("질문은 4,000자 이하로 입력하세요.");
      return;
    }
    busy.current = true;
    setPending(content);
    setDraft("");
    setError("");
    const input = conversationInput(messages, content);
    const request = new AbortController();
    controller.current = request;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: input }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(55000)]),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "응답을 받지 못했습니다. 다시 시도하세요.",
        );
      if (typeof data.text !== "string" || !data.text.trim())
        throw new Error("비어 있는 응답입니다. 다시 시도하세요.");
      if (!request.signal.aborted)
        setMessages([
          ...messages,
          { role: "user", content },
          { role: "assistant", content: data.text },
        ]);
    } catch (cause) {
      if (!request.signal.aborted) {
        setError(
          cause instanceof Error && cause.name === "TimeoutError"
            ? "응답 시간이 초과되었습니다. 잠시 후 다시 시도하세요."
            : cause instanceof TypeError || cause instanceof SyntaxError
              ? "네트워크 또는 서버 응답 오류입니다. 잠시 후 다시 시도하세요."
              : cause instanceof Error
                ? cause.message
                : "요청에 실패했습니다.",
        );
        setDraft(content);
      }
    } finally {
      busy.current = false;
      if (!request.signal.aborted) setPending("");
    }
  }
  return (
    <section className="panel chat">
      <ConnectionStatus />
      <label className="mode-label">
        전문 모드
        <select
          value={mode}
          disabled={Boolean(pending)}
          onChange={(e) => {
            setMode(e.target.value as ChatMode);
            setMessages([]);
            setError("");
          }}
        >
          {modes.map((m) => (
            <option value={m.id} key={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <p className="chat-limit-note">
        모드를 바꾸면 새 대화를 시작합니다. 대화는 현재 화면에서만 유지되며,
        응답 요청에는 최근 최대 10회 대화·24,000자를 사용합니다.
      </p>
      <div className="chat-capabilities">
        파일 분석 · 외부 검색 · 실시간 공고 · 매뉴얼 조회: 미연동. 필요한 자료는
        텍스트로 입력하세요. 입력한 대화는 응답 생성을 위해 OpenAI로 전송됩니다.
      </div>
      <div
        className="chat-messages"
        aria-live="polite"
        aria-busy={Boolean(pending)}
      >
        {!messages.length && !pending && (
          <div className="chat-welcome">
            <Sparkles size={36} />
            <h2>어떤 일을 함께 해볼까요?</h2>
            <p>전문 모드를 선택하고 업무에 대해 질문하세요.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div className={`message ${m.role}`} key={i}>
            <strong>
              {m.role === "user"
                ? "나"
                : `AI 비서 · ${modes.find((m) => m.id === mode)?.label}`}
            </strong>
            <p>{m.content}</p>
          </div>
        ))}
        {pending && (
          <>
            <div className="message user">
              <strong>나</strong>
              <p>{pending}</p>
            </div>
            <div className="chat-loading" role="status">
              <LoaderCircle size={17} className="spin" />
              답변을 작성하고 있습니다…
            </div>
          </>
        )}
        <div ref={end} />
      </div>
      {error && (
        <div className="chat-error" role="alert">
          {error}
          <p>질문을 입력창에 복원했습니다. 설정을 확인한 후 다시 보내세요.</p>
        </div>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          aria-label="메시지"
          value={draft}
          disabled={Boolean(pending)}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="업무에 대해 무엇이든 물어보세요"
          maxLength={MAX_MESSAGE_CHARS}
          rows={2}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          className="button primary"
          disabled={!draft.trim() || Boolean(pending)}
          aria-label="메시지 보내기"
        >
          {pending ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
      <p className="chat-limit-note">
        {draft.length.toLocaleString()} / 4,000자 · Enter 전송, Shift+Enter
        줄바꿈 · AI 답변의 수치와 사실을 확인하세요.
      </p>
    </section>
  );
}
