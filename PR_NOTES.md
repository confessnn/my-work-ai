# feat: My Work AI 채팅을 OpenAI Responses API와 연결

기존 고정 예시 응답을 서버 전용 OpenAI 공식 JavaScript SDK 호출로 교체했습니다. 사용자가 질문을 보내면 `/api/chat`에서 서버 환경변수의 키를 읽고 Responses API로 응답을 생성합니다. 다른 업무별 화면과 반응형 UI·다크모드는 유지합니다.

## 변경 파일과 동작

- `components/chat.tsx`: 입력·응답, 로딩·중복 전송 방지, 오류 안내·질문 복원, 5개 전문 모드, 키 설정 상태 안내
- `components/workspace.tsx`, `app/globals.css`: 기존 화면에 채팅 컴포넌트 적용, 설정 화면의 연결 상태, 미연동 안내 및 스타일
- `app/api/chat/route.ts`: 서버 전용 Responses API, OPENAI_API_KEY 및 선택적 OPENAI_MODEL, 오류 정리, no-store 응답, 같은 호스트 검사
- `lib/chat/prompts/*.ts`: 일반·원가분석·공공조달·엑셀·청소업의 별도 지침 파일
- `lib/chat/validation.ts`, `types.ts`, `rate-limit.ts`: 입력 검증, 최근 대화 선택, 호출 제한
- `.env.local.example`: 환경변수 이름과 빈 값만 포함
- `.gitignore`: 실제 환경파일은 제외하고 예제 파일만 추적
- `package.json`, `package-lock.json`: 공식 SDK, server-only, 테스트 런타임 및 npm test 명령
- `tests/chat.test.ts`: 외부 네트워크 없이 입력·호출 제한·SDK 요청 형식·오류 처리 검증
- `readme`: 기존 원문을 유지하고 현재 설정·실행 방법과 실제 키 연결 후 테스트 항목을 한국어로 추가

## 검증 결과

- npm run lint: 통과, 오류·경고 없음
- npx tsc --noEmit: 통과
- npm run build: 통과, /api/chat 동적 서버 라우트 생성
- npm test: 4개 검사 그룹 통과. 입력·역할·JSON 크기·호출 제한, Responses 요청·응답, 인증·모델·한도 오류, 키 없음 및 미완료 응답 검사
- 개발 서버의 실제 GET /api/chat: configured: false
- 실제 브라우저에서 키 없이 질문 전송: HTTP 503, 연결 안내와 질문 복원, 예시 응답을 만들어내지 않음
- SDK 모의 테스트: /v1/responses 요청, 전문 지침·대화·store: false·출력 한도 전달 확인
- 브라우저 모의 응답 테스트: 로딩, 전송 버튼 잠금, 응답 출력, 후속 질문, 모드 변경 시 초기화, 429 오류·입력 복원 확인
- 기존 7개 경로 HTTP 200, 모바일 390px 가로 넘침 없음, 브라우저 JavaScript 오류 없음
- 실제 비밀키를 생성·저장·커밋하지 않음. 모의 테스트에서만 명확한 가짜 문자열 사용

## 제한과 실제 연결 후 확인

실제 API 키가 없으므로 OpenAI의 실제 응답·모델 접근 권한·결제 상태는 검증하지 않았습니다. README 순서대로 .env.local을 설정하고 서버를 재시작한 뒤 단일·후속 질문, 전문 모드별 응답, 미연동 기능 안내, 실제 사용량을 확인해야 합니다.

파일 분석·웹 검색·실시간 공고·매뉴얼 조회는 미연동이며 UI와 시스템 지침에서 명시합니다. 대화는 현재 화면에만 유지하고 DB·브라우저 저장소에 저장하지 않습니다. 요청에는 최근 10회 대화와 현재 질문만 전달하며 총 24,000자 이내로 줄입니다.

서버 한 프로세스 전체에서 분당 10회·최근 24시간 200회·동시 2회로 제한합니다. 질문 최대 4,000자, JSON 최대 96KiB, 응답 최대 1,200토큰, SDK 타임아웃 45초, 자동 재시도 없음입니다. 카운터는 메모리 기반으로 재시작 시 초기화되고 여러 인스턴스에 공유되지 않습니다. 운영 공개 전에는 인증과 공유 저장소 기반 제한을 별도로 구현해야 합니다.

## PR 준비

대상: main ← codex/openai-chat

현재 원격 main에는 최초 안내 파일만 있으므로 새 브랜치는 이전 앱 구현 커밋을 포함합니다. main을 재작성하거나 기존 UI를 제거하지 않았습니다. 이전 앱 브랜치를 먼저 병합한다면 이 브랜치는 자연스럽게 채팅 연동 변경만 비교할 수 있습니다.

권장 제목: feat: My Work AI 채팅을 OpenAI Responses API와 연결
