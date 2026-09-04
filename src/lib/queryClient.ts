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
  // 첨부 조회 URL. id 순서가 달라도 같은 캐시를 쓰도록 정렬해서 키를 만든다.
  attachmentUrls: (ids: number[]) =>
    ["attachments", "urls", [...ids].sort((a, b) => a - b)] as const,
};
