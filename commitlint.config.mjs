/**
 * commitlint 설정 — Conventional Commits 강제
 * CLAUDE.md 6장: feat / fix / chore / test / docs (본문은 한글 가능)
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 허용 타입 목록
    "type-enum": [
      2,
      "always",
      [
        "feat", // 새 기능
        "fix", // 버그 수정
        "docs", // 문서
        "style", // 서식 (동작 변화 없음)
        "refactor", // 리팩터링
        "perf", // 성능 개선
        "test", // 테스트
        "build", // 빌드/의존성
        "ci", // CI 설정
        "chore", // 기타 잡무
        "revert", // 되돌리기
      ],
    ],

    // 제목은 한글이므로 대소문자 규칙을 적용하지 않는다.
    "subject-case": [0],

    // 한글은 글자당 정보량이 많아 영문 기준(72자)보다 짧게 잡는다.
    "header-max-length": [2, "always", 72],

    // 제목 끝 마침표 금지
    "subject-full-stop": [2, "never", "."],

    // 본문/꼬리말 앞에는 빈 줄을 둔다.
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};
