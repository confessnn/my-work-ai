export const modes = [
  { id: "general", label: "일반 업무" },
  { id: "cost", label: "원가분석" },
  { id: "procurement", label: "공공조달" },
  { id: "excel", label: "엑셀" },
  { id: "cleaning", label: "청소업" },
] as const;
export type ChatMode = (typeof modes)[number]["id"];
export type ChatMessage = { role: "user" | "assistant"; content: string };
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_HISTORY_MESSAGES = 21;
export const MAX_TOTAL_CHARS = 24000;

export function conversationInput(
  history: ChatMessage[],
  content: string,
): ChatMessage[] {
  const result = [...history.slice(-20), { role: "user" as const, content }];
  while (
    result.length > 1 &&
    result.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS
  )
    result.splice(0, 2);
  return result;
}
