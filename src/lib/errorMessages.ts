import type { ApiError } from "@/types/api";

// PRD.md 5.1 에러 문구 매핑 표를 코드로 옮긴다.
// apiClient가 던지는 에러는 반드시 이 함수 하나로만 문구화한다 — 화면마다 직접 문구를 쓰면
// Phase 7·8에서 문구가 갈라져 매핑 표가 사문화된다.

export const NETWORK_ERROR_CODE = "NETWORK_ERROR" as const;

const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "이메일 또는 비밀번호가 올바르지 않습니다.",
  INVALID_REFRESH_TOKEN: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  INVALID_RESET_TOKEN: "만료되었거나 이미 사용된 링크입니다.",
  EMAIL_DUPLICATED: "이미 사용 중인 이메일입니다.",
  TODO_NOT_FOUND: "할 일을 찾을 수 없습니다.",
  INTERNAL_ERROR: "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
  [NETWORK_ERROR_CODE]: "연결에 실패했습니다.",
};

/**
 * error.code를 화면 문구로 변환한다.
 * - INVALID_INPUT은 서버가 준 필드별 message를 그대로 쓴다(공용 문구 없음).
 * - TOKEN_EXPIRED는 apiClient가 자동 갱신을 시도하는 신호일 뿐 사용자에게 보이지 않는다.
 *   (apiClient의 재시도가 실패하면 UNAUTHORIZED로 처리되어 이 함수까지 온다)
 */
export function toDisplayMessage(error: ApiError): string {
  if (error.code === "INVALID_INPUT") return error.message;
  return MESSAGES[error.code] ?? MESSAGES.INTERNAL_ERROR;
}

export function networkErrorMessage(): string {
  return MESSAGES[NETWORK_ERROR_CODE];
}
