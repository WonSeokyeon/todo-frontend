# todo-frontend

Todo List 서비스의 프론트엔드입니다. Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS 4 로 구성되어 있습니다.

---

## 시작하기

```bash
npm install      # 의존성 설치 (git 훅도 이때 자동 설정됩니다)
npm run dev      # 개발 서버 실행 → http://localhost:3000
```

`npm install` 시 `prepare` 스크립트가 husky 를 설정하므로, 훅 활성화를 위해 따로 할 일은 없습니다.

---

## 명령어

| 명령                   | 설명                                               |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | 개발 서버 실행                                     |
| `npm run build`        | 프로덕션 빌드                                      |
| `npm run start`        | 빌드 결과 실행                                     |
| `npm run typecheck`    | 라우트 타입 생성 후 타입 검사                      |
| `npm run lint`         | ESLint 검사                                        |
| `npm run lint:fix`     | ESLint 자동 수정                                   |
| `npm run format`       | Prettier 서식 일괄 적용                            |
| `npm run format:check` | 서식 위반 여부만 확인                              |
| `npm run validate`     | **타입 검사 + 린트(경고 0) + 서식 검사 전체 실행** |

커밋 전에 전체를 확인하고 싶다면 `npm run validate` 를 실행하세요.

---

## 개발 도구 구성

### ESLint

`eslint.config.mjs` (Flat Config). `eslint-config-next` 위에 프로젝트 규칙을 얹었습니다.

| 규칙                                         | 수준  | 근거                                            |
| -------------------------------------------- | ----- | ----------------------------------------------- |
| `@typescript-eslint/no-explicit-any`         | error | `any` 금지 (CLAUDE.md 4장)                      |
| `@typescript-eslint/no-unused-vars`          | error | 미사용 변수 금지. 의도적이면 `_` 접두사         |
| `@typescript-eslint/consistent-type-imports` | error | 타입 전용 import 명시 → 번들 축소               |
| `no-console`                                 | warn  | 디버그 로그 잔류 방지 (`warn`/`error` 는 허용)  |
| `eqeqeq`                                     | error | 암묵적 형변환 방지                              |
| `no-restricted-syntax`                       | error | JWT/AWS 키 하드코딩 차단 (CLAUDE.md 절대규칙 9) |

`components/ui/**` 는 shadcn/ui 가 생성한 코드이므로 린트 대상에서 제외합니다.

### Prettier

`.prettierrc.json`. 서식 규칙은 Prettier 가 단독으로 담당하고,
`eslint-config-prettier` 가 ESLint 쪽의 겹치는 서식 규칙을 모두 꺼 충돌을 없앱니다.

`prettier-plugin-tailwindcss` 가 Tailwind 클래스를 공식 권장 순서로 자동 정렬합니다.
Tailwind CSS 4 는 설정이 CSS 안에 있으므로 `tailwindStylesheet: "./app/globals.css"` 로 진입점을 지정했습니다.
`cn()`, `cva()`, `clsx()`, `twMerge()` 호출 안의 클래스도 함께 정렬됩니다.

### 타입 검사

```bash
npm run typecheck   # tsc --noEmit
```

`tsconfig.json`의 `include`에 `.next/types/**/*.ts`가 포함되어 있어, Next.js가 `next dev` 또는 `next build` 실행 중에 생성하는 라우트 타입(`PageProps` 등)도 함께 검사 대상이 됩니다.
저장소를 새로 받은 직후처럼 `.next/`가 아직 없는 상태에서는 이 부분만 검사에서 빠지므로, 라우트 타입까지 확인하려면 `npm run dev` 또는 `npm run build`를 한 번 실행한 뒤 `npm run typecheck`를 돌립니다.

---

## git 훅

husky 로 관리합니다. (`.husky/`)

### `pre-commit`

`lint-staged` 가 **스테이징된 파일에만** 도구를 적용합니다.

| 대상                            | 작업                                                 |
| ------------------------------- | ---------------------------------------------------- |
| `*.ts` `*.tsx`                  | `eslint --fix` → `prettier --write` → 전체 타입 검사 |
| `*.js` `*.mjs` 등               | `eslint --fix` → `prettier --write`                  |
| `*.json` `*.css` `*.md` `*.yml` | `prettier --write`                                   |

타입 검사만 전체 프로젝트 단위로 실행합니다.
`tsc` 에 파일 경로를 직접 넘기면 `tsconfig.json` 이 통째로 무시되어
`strict` 옵션과 `@/*` 경로 별칭이 적용되지 않기 때문입니다.

자동 수정된 내용은 다시 스테이징되어 커밋에 그대로 포함됩니다.
검사가 실패하면 lint-staged 가 원래 상태로 되돌리므로, 작업 중이던 변경이 훼손되지 않습니다.

### `commit-msg`

`commitlint` 가 Conventional Commits 형식을 검사합니다. (CLAUDE.md 6장)

```
<타입>(<범위>): <제목>

타입: feat fix docs style refactor perf test build ci chore revert
제목: 72자 이내, 끝에 마침표 없음
```

```bash
# 올바른 예
git commit -m "feat: 할 일 목록 페이지 추가"
git commit -m "fix(auth): 401 응답 시 토큰 재발급이 무한 반복되던 문제 수정"
```

제목 대소문자 규칙(`subject-case`)은 한글 제목을 위해 꺼 두었습니다.

### 검사를 건너뛰어야 할 때

```bash
git commit --no-verify
```

---

## 에디터 설정

`.vscode/settings.json` 에 저장 시 자동 서식/자동 수정이 설정되어 있습니다.
`.vscode/extensions.json` 의 권장 확장(Prettier, ESLint, Tailwind CSS IntelliSense, EditorConfig)을 설치하면 그대로 동작합니다.

`.gitattributes` 로 저장소 줄바꿈을 LF 로 정규화했습니다.
Windows 의 `core.autocrlf` 설정과 Prettier 의 `endOfLine: "lf"` 가 충돌해
파일이 계속 수정된 것으로 표시되는 문제를 막기 위한 것입니다.
