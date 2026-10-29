import "server-only";
import OpenAI from "openai";
import { instructions } from "@/lib/chat/prompts";
import { BodyError, readBody, validateChat } from "@/lib/chat/validation";
import { limiter } from "@/lib/chat/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
const fail = (status: number, error: string, extra = {}) =>
  Response.json({ error }, { status, headers: { ...headers, ...extra } });

// A configured key is not proof that the account/model can actually make a request.
export function GET() {
  return Response.json(
    { configured: Boolean(process.env.OPENAI_API_KEY?.trim()) },
    { headers },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      // Next's internal request URL may use localhost even when the browser uses
      // 127.0.0.1. Match the actual Host header, without trusting forwarded hosts.
      const source = new URL(origin);
      const host = request.headers.get("host") ?? new URL(request.url).host;
      if (
        !["http:", "https:"].includes(source.protocol) ||
        source.host !== host
      )
        return fail(403, "다른 출처의 요청은 허용하지 않습니다.");
    } catch {
      return fail(403, "올바른 출처의 요청이 아닙니다.");
    }
  }
  let input;
  try {
    input = validateChat(await readBody(request));
  } catch (error) {
    return error instanceof BodyError
      ? fail(error.status, error.message)
      : fail(400, "요청을 읽을 수 없습니다.");
  }
  if (!input)
    return fail(
      400,
      "모드와 대화 형식을 확인하세요. 질문은 1~4,000자, 대화는 최대 21개·24,000자입니다.",
    );
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey)
    return fail(
      503,
      "OpenAI API 키가 설정되지 않았습니다. 서버의 .env.local에 OPENAI_API_KEY를 설정하고 서버를 재시작하세요.",
    );
  const slot = limiter.acquire();
  if ("retryAfter" in slot)
    return fail(
      429,
      `호출 제한에 도달했습니다. ${slot.retryAfter}초 후 다시 시도하세요.`,
      { "Retry-After": String(slot.retryAfter) },
    );
  try {
    const client = new OpenAI({ apiKey, timeout: 45000, maxRetries: 0 });
    const response = await client.responses.create(
      {
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
        instructions: instructions(input.mode),
        input: input.messages,
        max_output_tokens: 1200,
        store: false,
      },
      { signal: request.signal },
    );
    if (response.status === "incomplete")
      return fail(
        502,
        "응답이 길이 제한 등으로 완료되지 않았습니다. 질문을 더 작게 나누어 다시 시도하세요.",
      );
    const text = response.output_text?.trim();
    if (!text || response.status !== "completed")
      return fail(
        502,
        "텍스트 응답을 받지 못했습니다. 질문을 바꾸어 다시 시도하세요.",
      );
    return Response.json({ text }, { headers });
  } catch (error) {
    // Never return/log provider bodies, headers, API keys or conversation content.
    if (
      error instanceof OpenAI.APIConnectionTimeoutError ||
      request.signal.aborted
    )
      return fail(
        504,
        "응답 시간이 초과되었거나 요청이 취소되었습니다. 잠시 후 다시 시도하세요.",
      );
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429)
        return fail(
          429,
          "OpenAI 사용 한도 또는 요청 제한에 도달했습니다. 사용량과 결제 설정을 확인하세요.",
          { "Retry-After": "60" },
        );
      if (error.status === 401 || error.status === 403)
        return fail(
          502,
          "OpenAI 인증 또는 접근 권한 오류입니다. 서버의 API 키와 프로젝트 권한을 확인하세요.",
        );
      if (error.status === 404 || error.status === 400)
        return fail(
          502,
          "OpenAI 모델 또는 요청 설정을 확인하세요. OPENAI_MODEL과 계정의 모델 접근 권한을 확인하세요.",
        );
    }
    return fail(502, "AI 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.");
  } finally {
    slot.release();
  }
}
