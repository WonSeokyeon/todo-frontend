"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { TodoItem } from "@/components/todo/TodoItem";
import type { TodoResponse } from "@/types/todo";

interface TodoListProps {
  todos: TodoResponse[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasKeyword: boolean;
  onCreate: () => void;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

export function TodoList({
  todos,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasKeyword,
  onCreate,
  onToggle,
  onDelete,
  deletingId,
}: TodoListProps) {
  if (isLoading) return <ListSkeleton />;
  if (isError)
    return (
      <ErrorState
        message={errorMessage ?? "일시적인 오류가 발생했습니다. 다시 시도해 주세요."}
        onRetry={onRetry}
      />
    );

  if (todos.length === 0) {
    // 빈 상태와 검색 결과 없음은 문구로 구분한다 (UX-03).
    return hasKeyword ? (
      <EmptyState title="검색 결과가 없어요" />
    ) : (
      <EmptyState title="아직 할 일이 없어요" actionLabel="할 일 추가" onAction={onCreate} />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={(completed) => onToggle(todo.id, completed)}
          onDelete={() => onDelete(todo.id)}
          isDeleting={deletingId === todo.id}
        />
      ))}
    </ul>
  );
}
