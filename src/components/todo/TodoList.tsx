"use client";

import { AnimatePresence } from "motion/react";

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
      {/* initial을 생략(기본값 true)해야 AnimatePresence가 처음 마운트되는 시점(=목록이
          화면에 처음 나타나는 시점)에도 진입 stagger가 재생된다 (CLAUDE.md 8장). */}
      <AnimatePresence mode="popLayout">
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            index={index}
            onDelete={() => onDelete(todo.id)}
            isDeleting={deletingId === todo.id}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
