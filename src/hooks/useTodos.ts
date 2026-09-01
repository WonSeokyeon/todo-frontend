"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryClient";
import type { PageResponse } from "@/types/api";
import type {
  TodoCreateRequest,
  TodoListParams,
  TodoResponse,
  TodoUpdateRequest,
} from "@/types/todo";

function buildListPath(params: TodoListParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("size", String(params.size));
  if (params.completed !== undefined) search.set("completed", String(params.completed));
  if (params.keyword) search.set("keyword", params.keyword);
  return `/todos?${search.toString()}`;
}

export function useTodos(params: TodoListParams) {
  return useQuery({
    queryKey: queryKeys.todos(params),
    queryFn: () => apiClient.get<PageResponse<TodoResponse>>(buildListPath(params)),
  });
}

export function useTodo(id: number) {
  return useQuery({
    queryKey: queryKeys.todo(id),
    queryFn: () => apiClient.get<TodoResponse>(`/todos/${id}`),
    enabled: Number.isFinite(id),
    // TODO_NOT_FOUND(404)는 재시도해도 결과가 같다. 실측 중 재시도가 fetchStatus를
    // "paused"에 가둬 화면이 로딩 상태에서 멈추는 문제도 함께 발견해 끄기로 했다.
    retry: false,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TodoCreateRequest) => apiClient.post<TodoResponse>("/todos", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useUpdateTodo(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TodoUpdateRequest) => apiClient.put<TodoResponse>(`/todos/${id}`, body),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.todo(id), data);
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

/**
 * 완료 토글. 목표 상태를 그대로 서버에 전송한다 (CLAUDE.md 5장).
 * 낙관적 업데이트는 Phase 9에서 추가한다 — 여기서는 단순 호출 + invalidate만 한다.
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      apiClient.patch<TodoResponse>(`/todos/${id}/toggle`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

/**
 * 삭제. 페이지 이동 여부는 호출부(목록 화면)가 onSuccess 콜백으로 직접 판단한다
 * — 서버 삭제가 확정된 뒤에만 이동해야 실패 시 롤백이 사용자가 보는 화면에 남는다 (CLAUDE.md 9장).
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
