import {
  modes,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_TOTAL_CHARS,
  type ChatMessage,
  type ChatMode,
} from "./types";
export type ChatInput = { mode: ChatMode; messages: ChatMessage[] };
export function validateChat(value: unknown): ChatInput | null {
  if (!value || typeof value !== "object") return null;
  const { mode, messages } = value as Record<string, unknown>;
  if (
    !modes.some((m) => m.id === mode) ||
    !Array.isArray(messages) ||
    !messages.length ||
    messages.length > MAX_HISTORY_MESSAGES ||
    messages.length % 2 !== 1
  )
    return null;
  let total = 0;
  const clean: ChatMessage[] = [];
  for (const [i, item] of messages.entries()) {
    if (
      !item ||
      typeof item !== "object" ||
      item.role !== (i % 2 ? "assistant" : "user") ||
      typeof item.content !== "string"
    )
      return null;
    const content = item.content.trim();
    if (
      !content ||
      content.length > (item.role === "user" ? MAX_MESSAGE_CHARS : 12000)
    )
      return null;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;
    clean.push({ role: item.role, content });
  }
  return { mode: mode as ChatMode, messages: clean };
}

export class BodyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readBody(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new BodyError(415, "JSON 형식으로 요청하세요.");
  const limit = 96 * 1024;
  if (Number(request.headers.get("content-length")) > limit)
    throw new BodyError(413, "요청 크기가 너무 큽니다.");
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400, "메시지가 없습니다.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new BodyError(413, "요청 크기가 너무 큽니다.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BodyError(400, "올바른 JSON 요청이 아닙니다.");
  }
}
