"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AUTH_CHANGE_EVENT,
  apiClient,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryClient";
import type { LoginRequest, SignupRequest, TokenResponse, UserResponse } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Access Token이 만료됐는지 판정한다. 서명 검증은 서버가 하므로 프론트는 exp만 읽으면 된다.
 *
 * "localStorage에 토큰 문자열이 있는가"만 검사하면 만료된 토큰이 판정을 통과해,
 * 401 왕복 동안 보호된 화면이 사용자에게 노출된다 (AUTH-07 위반, CLAUDE.md 9장).
 */
export function isExpired(token: string): boolean {
  try {
    // JWT payload는 base64url이라 atob이 그대로 읽지 못한다. 표준 base64로 바꾸고 패딩을 채운다.
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true; // 형식이 깨진 토큰도 만료로 취급한다
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 서버 렌더 결과와 어긋나지 않도록 인증 상태는 마운트 이후에만 읽는다 (CLAUDE.md 9장).
  // apiClient의 자동 refresh·자동 로그아웃도 AUTH_CHANGE_EVENT를 쏘므로 여기서 함께 반영된다.
  useEffect(() => {
    const sync = () => {
      const current = getAccessToken();
      if (current !== null && isExpired(current)) {
        // 만료로 판정되면 즉시 폐기하고 미인증으로 처리한다.
        clearAccessToken();
        setToken(null);
        return;
      }
      setToken(current);
    };

    sync();
    setReady(true);
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  const status: AuthStatus = !ready
    ? "loading"
    : token !== null
      ? "authenticated"
      : "unauthenticated";

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.get<UserResponse>("/auth/me"),
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    retry: false, // 401은 재시도해도 결과가 같다
  });

  const login = useCallback(
    async (request: LoginRequest) => {
      const { accessToken } = await apiClient.post<TokenResponse>("/auth/login", request);
      setAccessToken(accessToken);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
    [queryClient],
  );

  // 가입 응답에도 토큰과 Refresh 쿠키가 함께 오므로 별도 로그인 없이 인증 상태가 된다.
  const signup = useCallback(
    async (request: SignupRequest) => {
      const { accessToken } = await apiClient.post<TokenResponse>("/auth/signup", request);
      setAccessToken(accessToken);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
    [queryClient],
  );

  /**
   * 로그아웃은 서버 API를 호출해 Refresh Token을 DB에서 폐기하고 쿠키를 만료시킨다.
   * 클라이언트 토큰 삭제만으로 끝내지 않는다 (CLAUDE.md 6장).
   *
   * 서버 호출이 실패해도(네트워크 오류·서버 다운) 클라이언트 정리는 그대로 진행한다
   * (ROADMAP v1.21 확정). 중단하면 서버 장애 시 사용자가 로그아웃조차 못 하고 갇힌다.
   * 남은 Refresh Token은 서버 복구 후 /auth/refresh 시점에 정리되거나 최대 14일 후 만료된다.
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.post<void>("/auth/logout");
    } catch {
      // 의도적으로 무시한다 — 사용자에게 에러를 띄우지 않는다.
    } finally {
      clearAccessToken();
      queryClient.clear();
    }
  }, [queryClient]);

  return {
    status,
    isAuthenticated: status === "authenticated",
    /** GET /auth/me 응답. email이 들어있지만 화면에 렌더하지 않는다 (AUTH-08) */
    user: meQuery.data,
    isUserLoading: status === "authenticated" && meQuery.isPending,
    login,
    signup,
    logout,
  };
}
