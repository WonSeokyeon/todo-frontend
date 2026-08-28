/**
 * lint-staged 설정
 *
 * 스테이징된 파일에만 도구를 적용해 커밋 속도를 유지한다.
 * 단, TypeScript 타입 검사는 파일 단위로 나눌 수 없다.
 * (tsc 에 파일 경로를 직접 넘기면 tsconfig.json 이 통째로 무시되어
 *  strict 옵션과 @/* 경로 별칭이 적용되지 않는다)
 * 따라서 타입 검사만 프로젝트 전체 단위로 실행한다.
 *
 * 주의: 같은 glob 키를 두 번 쓰면 뒤에 온 것이 앞을 덮어쓰므로
 *       하나의 키에 배열로 모아 순서대로 실행시킨다.
 */
export default {
  // TS/TSX: 자동 수정 → 서식 적용 → 전체 타입 검사
  "*.{ts,tsx,mts,cts}": ["eslint --fix", "prettier --write", () => "npm run typecheck"],

  // JS 계열 (설정 파일 등)
  "*.{js,jsx,mjs,cjs}": ["eslint --fix", "prettier --write"],

  // 서식만 적용하는 파일들
  "*.{json,jsonc,css,scss,md,mdx,yml,yaml}": ["prettier --write"],
};
