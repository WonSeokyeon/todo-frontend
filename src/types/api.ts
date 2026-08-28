// CLAUDE.md 5장 공통 응답 포맷과 11장 에러 코드 표에 대응한다.

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "INVALID_REFRESH_TOKEN"
  | "INVALID_RESET_TOKEN"
  | "FORBIDDEN"
  | "TODO_NOT_FOUND"
  | "EMAIL_DUPLICATED"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ErrorCode | string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
