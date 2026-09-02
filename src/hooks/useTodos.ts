"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/apiClient";
import type { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
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

type TodosSnapshot = Array<[QueryKey, PageResponse<TodoResponse> | undefined]>;

// 목록 캐시는 필터·페이지별로 여러 개가 동시에 캐시돼 있을 수 있다.
// 지금 어떤 화면(필터·페이지)이 보이는지 훅이 알 필요는 없다 — "todos" 접두사로 걸리는 캐시를 전부 고친다.
async function snapshotTodos(queryClient: QueryClient): Promise<TodosSnapshot> {
  await queryClient.cancelQueries({ queryKey: ["todos"] });
  return queryClient.getQueriesData<PageResponse<TodoResponse>>({ queryKey: ["todos"] });
}

function restoreTodos(queryClient: QueryClient, snapshot: TodosSnapshot): void {
  snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
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
 * 완료 토글. 항목마다 별도 인스턴스로 호출한다(TodoItem에서 사용).
 * scope.id는 useMutation 정의 시점에 고정돼 하나의 공유 인스턴스로는 항목별 직렬화를 걸 수 없어,
 * todo.id를 훅 인자로 받아 항목별로 요청 큐를 분리한다(CLAUDE.md 9장 방법 1).
 * 연타 지연이 체감되면 scope를 지우고 onSettled의 isMutating 가드(방법 2)로 바꾼다.
 */
export function useToggleTodo(id: number) {
  const queryClient = useQueryClient();
  return useMutation<TodoResponse, ApiClientError, boolean, TodosSnapshot>({
    mutationKey: ["todo-toggle", id],
    scope: { id: `todo-toggle-${id}` },
    mutationFn: (completed) => apiClient.patch<TodoResponse>(`/todos/${id}/toggle`, { completed }),
    onMutate: async (completed) => {
      const snapshot = await snapshotTodos(queryClient);
      queryClient.setQueriesData<PageResponse<TodoResponse>>({ queryKey: ["todos"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((todo) => (todo.id === id ? { ...todo, completed } : todo)),
        };
      });
      return snapshot;
    },
    onError: (error, _completed, snapshot) => {
      if (snapshot) restoreTodos(queryClient, snapshot);
      toast.error(toDisplayMessage(error.error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

/**
 * 삭제. 낙관적으로 목록 캐시에서 즉시 제거한다.
 * 페이지 이동 여부는 여전히 호출부(목록 화면)가 onSuccess 콜백으로 판단한다 —
 * onMutate는 캐시만 건드리고 라우팅하지 않는다(CLAUDE.md 9장, TODO-13).
 */
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiClientError, number, TodosSnapshot>({
    mutationFn: (id) => apiClient.delete<void>(`/todos/${id}`),
    onMutate: async (id) => {
      const snapshot = await snapshotTodos(queryClient);
      queryClient.setQueriesData<PageResponse<TodoResponse>>({ queryKey: ["todos"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.filter((todo) => todo.id !== id),
          totalElements: Math.max(0, old.totalElements - 1),
        };
      });
      return snapshot;
    },
    onError: (error, _id, snapshot) => {
      if (snapshot) restoreTodos(queryClient, snapshot);
      toast.error(toDisplayMessage(error.error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
