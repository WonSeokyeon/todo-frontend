// CLAUDE.md 4장 「입력값 제약」 표를 코드로 옮긴다.
// 폼 라이브러리를 쓰지 않기로 확정했으므로(CLAUDE.md 3장) 검증을 화면마다 흩어 두지 않고 여기 모은다.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): boolean {
  return value.length > 0 && value.length <= 255 && EMAIL_PATTERN.test(value);
}

export function validateNickname(value: string): boolean {
  return value.length >= 1 && value.length <= 50;
}

export function validateTitle(value: string): boolean {
  return value.trim().length >= 1 && value.length <= 200;
}

export function validateContentLength(value: string): boolean {
  return value.length <= 50_000;
}

/**
 * 비밀번호 최소 길이는 문자 수, 최대 길이는 UTF-8 바이트 수로 검증한다.
 * BCrypt 한계는 72바이트다. 한글 1자는 3바이트라 문자 수만 세면 한글 25자(=75바이트)가
 * 통과해 서버 인코딩 단계에서 500이 난다(CLAUDE.md 4장). 프론트는 제출 전에 미리 막는다.
 */
export function validatePassword(value: string): {
  valid: boolean;
  reason?: "too-short" | "too-long";
} {
  if (value.length < 6) return { valid: false, reason: "too-short" };
  if (new TextEncoder().encode(value).length > 72) return { valid: false, reason: "too-long" };
  return { valid: true };
}
