import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // eslint-config-next 의 기본 ignore 를 덮어쓴다.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn/ui 가 생성한 컴포넌트는 원본 형태를 유지한다.
    // 규칙 위반이 있으면 개별 파일에서 처리한다.
    "components/ui/**",
  ]),

  // ── 프로젝트 규칙 (CLAUDE.md 4장 TypeScript 컨벤션) ──
  {
    name: "todo-project/rules",
    rules: {
      // any 금지. 불가피하면 unknown + 타입가드를 쓴다.
      "@typescript-eslint/no-explicit-any": "error",

      // 미사용 변수는 오류. 의도적으로 버리는 값은 _ 접두사로 표시한다.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // 타입 전용 import 를 명시해 번들에서 제거되도록 한다.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // 디버그용 console.log 가 커밋되는 것을 막는다. (경고/오류 로그는 허용)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // == 비교로 인한 암묵적 형변환 방지 (null 비교는 예외)
      eqeqeq: ["error", "always", { null: "ignore" }],

      // 토큰/비밀이 하드코딩되기 쉬운 지점을 줄인다. (CLAUDE.md 절대규칙 9)
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^(eyJ[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16})/]",
          message:
            "JWT 또는 AWS 액세스 키로 보이는 문자열입니다. 환경변수로 분리하세요. (CLAUDE.md 절대규칙 9)",
        },
      ],
    },
  },

  // ── 루트의 도구 설정 파일은 규칙을 완화한다 ──
  {
    name: "todo-project/config-files",
    files: [
      "*.config.{js,mjs,cjs,ts,mts}",
      "*.config.*.{js,mjs,cjs,ts,mts}",
      ".lintstagedrc.{js,mjs,cjs}",
      ".prettierrc.{js,mjs,cjs}",
    ],
    rules: {
      // 설정 파일은 객체를 그대로 default export 하는 것이 관례다.
      "import/no-anonymous-default-export": "off",
      "no-console": "off",
    },
  },

  // Prettier 와 겹치는 서식 규칙을 모두 끈다.
  // 반드시 마지막에 위치해야 앞선 설정을 덮어쓸 수 있다.
  prettier,
]);

export default eslintConfig;
