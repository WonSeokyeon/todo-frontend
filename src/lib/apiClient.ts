import type { ApiError, ApiResponse } from "@/types/api";
import { NETWORK_ERROR_CODE } from "@/lib/errorMessages";

// CLAUDE.md 6장: Access Token은 localStorage 키 todo_access_token에 저장한다.
const ACCESS_TOKEN_KEY = "todo_access_token";
const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1`;

export class ApiClientError extends Error {
  readonly error: ApiError;
  constructor(error: ApiError) {
    super(error.message);
    this.error = error;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * 토큰이 바뀐 사실을 useAuth에 알리는 이벤트.
 * localStorage는 같은 탭에서 storage 이벤트를 쏘지 않으므로 직접 알려야 한다.
 * apiClient의 자동 refresh(setAccessToken)와 자동 로그아웃(clearAccessToken)도 이 경로를 지나므로,
 * 구독자는 토큰을 누가 바꿨든 동일하게 반응한다.
 */
export const AUTH_CHANGE_EVENT = "todo-auth:change";

function notifyTokenChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyTokenChanged();
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  notifyTokenChanged();
}

/**
 * apiClient는 라우터에 접근할 수 없으므로 이벤트로만 알린다.
 * Phase 7에서 최상위 컴포넌트가 이 이벤트를 듣고 /login으로 이동한다.
 */
function notifyLoggedOut() {
  clearAccessToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("todo-auth:logout"));
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** refresh 요청 자체는 재시도 루프에서 제외한다 (CLAUDE.md 6장) */
  skipAuthRefresh?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

// 여러 요청이 동시에 401(TOKEN_EXPIRED)을 만나도 refresh는 한 번만 시도한다.
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    })
      .then((data) => {
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRefresh, headers, ...rest } = options;
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      // Refresh Token이 httpOnly 쿠키로 오가므로 인증 요청은 항상 credentials: 'include' (CLAUDE.md 6장)
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError({
      code: NETWORK_ERROR_CODE,
      message: "네트워크 요청에 실패했습니다.",
    });
  }

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!json) {
    throw new ApiClientError({
      code: NETWORK_ERROR_CODE,
      message: "서버 응답을 해석할 수 없습니다.",
    });
  }

  if (json.success) {
    return json.data as T;
  }

  const error = json.error ?? { code: "INTERNAL_ERROR", message: "알 수 없는 오류입니다." };

  if (error.code === "TOKEN_EXPIRED" && !skipAuthRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return rawRequest<T>(path, { ...options, skipAuthRefresh: true });
    }
    notifyLoggedOut();
  } else if (error.code === "UNAUTHORIZED" || error.code === "INVALID_REFRESH_TOKEN") {
    notifyLoggedOut();
  }

  throw new ApiClientError(error);
}

export const apiClient = {
  get: <T>(path: string) => rawRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => rawRequest<T>(path, { method: "DELETE" }),
};
