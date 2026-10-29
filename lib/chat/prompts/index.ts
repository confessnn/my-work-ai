import "server-only";
import type { ChatMode } from "../types";
import { general } from "./general";
import { cost } from "./cost";
import { procurement } from "./procurement";
import { excel } from "./excel";
import { cleaning } from "./cleaning";
const prompts: Record<ChatMode, string> = {
  general,
  cost,
  procurement,
  excel,
  cleaning,
};
export function instructions(mode: ChatMode) {
  return `당신은 My Work AI의 한국어 업무 비서입니다. 답변은 명확하고 실용적으로 작성하세요. 현재 기능은 텍스트 대화뿐입니다. 파일 업로드 분석, 웹 검색, 실시간 공고 조회, 제조사 매뉴얼 조회, 외부 업무 실행은 미연동입니다. 수행하지 않은 작업을 수행했다고 주장하지 마세요. 해당 기능을 요청하면 한계를 밝히고 필요한 텍스트를 요청하세요. 제공되지 않은 자료·출처·금액을 만들어내지 마세요. 예시 수치와 가정은 '예시'라고 표시하세요.\n${prompts[mode]}`;
}
