import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  });
}

// 캐시 수정·롤백 대상이 명확하도록 쿼리 키를 고정한다 (CLAUDE.md 9장)
export const queryKeys = {
  todos: (filters: { page: number; size: number; completed?: boolean; keyword?: string }) =>
    ["todos", filters] as const,
  todo: (id: number) => ["todo", id] as const,
  me: () => ["auth", "me"] as const,
};
