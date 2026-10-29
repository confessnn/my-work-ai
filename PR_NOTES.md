# My Work AI 초기 앱 구현

## 변경 목적

안내 파일만 있던 저장소에서 업무별 UI를 PC·스마트폰으로 체험할 수 있도록 Next.js App Router 앱을 루트에 구성했습니다. 원격 `main`을 기준으로 `codex/my-work-ai` 브랜치를 사용하며 기존 Git 저장소를 유지했습니다.

## 구현

- 한국어 대시보드: 업무 바로가기, 예시 최근 작업, AI 채팅 이동
- AI 채팅: 공백 전송 방지, 사용자 메시지, 고정 예시 응답
- 원가분석: 견적 파일 선택·제거, 지원 확장자·20MB 검증, 예시 계산서 목록
- 공공조달: 예시 공고명·기관명 검색, 1169·2609·3612·9999 필터, 빈 검색 결과
- 엑셀: 파일 선택, 예시 요약 지표 및 항목별 지출 그래프
- 청소업: 예시 체크리스트와 완료 개수, 제조사 매뉴얼 파일 선택
- 설정: 표시 이름 저장·복원, 테마 저장·복원, 외부 API 미연결 상태
- PC 사이드바, 스마트폰 하단 메뉴, 다크모드, 경로별 직접 접근 및 잘못된 경로 404
- 필수 npm·TypeScript·Tailwind·ESLint 설정, 잠금 파일, `.gitignore`, Node.js 24 지정
- 기존 확장자 없는 `readme` 원문 보존 및 실행 설명 추가

## 검증 결과

환경: Windows, Node.js 24.22.1, npm 12.2.1, Next.js 16.4.3. npm registry의 latest 안정 버전을 조회해 설치 후 package.json 및 lock 파일에 고정했습니다.

- `npm install`: 성공, 취약점 0건
- `npm run lint`: 성공, 오류·경고 0건
- `npx tsc --noEmit`: 성공
- `npm run build`: 성공, 대시보드와 6개 업무 경로 생성
- `npm run dev -- --hostname 127.0.0.1`: 정상 기동
- Chromium 실제 브라우저: 7개 경로 HTTP 200, 잘못된 경로 404 확인
- 공고 4개 코드별 필터, 검색·빈 결과, 채팅 전송·예시 응답, 체크리스트 완료 개수 확인
- 파일 선택·제거 및 잘못된 확장자 거부 확인
- 이름·다크모드의 새로고침 후 복원 확인
- PC 1440px, 모바일 390px 화면 확인, 7개 모바일 경로 가로 넘침 없음, 하단 메뉴 이동 확인
- 브라우저 JavaScript 오류 없음

브라우저 검증용 Playwright와 Chromium은 임시 디렉터리에 설치해 프로젝트 의존성에 추가하지 않았습니다. npm 12가 `unrs-resolver`의 선택적 postinstall 스크립트를 차단했다는 안내가 있지만 위 린트·타입 검사·빌드는 정상 통과했습니다.

## 변경 파일

`app/layout.tsx`, `app/page.tsx`, `app/[section]/page.tsx`, `app/globals.css`, `components/workspace.tsx`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `.gitattributes`, `.nvmrc`, `AGENTS.md`(Next.js 자동 생성), `readme`, `PR_NOTES.md`.

## 후속 작업과 제한

실제 AI·조달·문서 분석 API, 인증, DB 저장은 범위 밖입니다. 파일은 서버로 업로드되지 않으며 내용 분석을 수행하지 않습니다. 분석 지표·금액·공고·응답은 예시로 표시합니다. 채팅·체크리스트·선택 파일명은 화면 이동·새로고침 시 초기화되며, 이름과 테마만 브라우저에 저장됩니다. 서버 API 연결 단계에서 별도 구현이 필요합니다. 비밀키는 포함하지 않았습니다.

## 권장 PR

제목: `feat: 한국어 통합 업무 비서 My Work AI 초기 UI 구현`

대상: `main` ← `codex/my-work-ai`

외부 API를 연결하기 전 업무별 흐름을 검토할 수 있는 UI 프로토타입입니다. 위 구현·검증 결과를 PR 설명으로 사용할 수 있습니다.
