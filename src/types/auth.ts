// 백엔드 `com.example.todoapp.dto`의 record와 1:1로 맞춘다 (CLAUDE.md 10장).
// 컴포넌트 안에서 인라인으로 다시 선언하지 않는다.

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /auth/signup · /auth/login · /auth/refresh 의 공통 응답.
 * Refresh Token은 httpOnly 쿠키로만 오가므로 바디에 없다 (CLAUDE.md 6장).
 * 가입 응답에도 토큰이 담겨 오므로, 가입 직후 곧바로 로그인 상태가 된다.
 */
export interface TokenResponse {
  accessToken: string;
}

/**
 * GET /auth/me 응답.
 * email은 응답에 포함되지만 화면 어디에도 렌더하지 않는다 (AUTH-08).
 */
export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
}
