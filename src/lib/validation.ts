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

/** 첨부 이미지 제약. 백엔드 app.upload.* 설정과 같은 값을 유지한다 (CLAUDE.md 5장). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * 업로드 전에 타입·크기를 미리 확인해 불필요한 왕복을 막는다.
 * 서버 검증(화이트리스트 + 매직바이트)은 그대로 유지된다 — 이건 편의 장치다.
 *
 * @returns 문제가 없으면 null, 있으면 사용자에게 보여줄 문구
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "JPEG, PNG, GIF, WebP 이미지만 첨부할 수 있습니다.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "이미지는 5MB 이하만 첨부할 수 있습니다.";
  }
  return null;
}
