"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Priority, TodoResponse } from "@/types/todo";

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const PRIORITY_CLASS: Record<Priority, string> = {
  HIGH: "border-priority-high/30 bg-priority-high/10 text-priority-high",
  MEDIUM: "border-priority-medium/30 bg-priority-medium/10 text-priority-medium",
  LOW: "border-priority-low/30 bg-priority-low/10 text-priority-low",
};

interface TodoItemProps {
  todo: TodoResponse;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, isDeleting }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={todo.completed ? "완료 취소" : "완료로 표시"}
      />

      <Link
        href={`/todos/${todo.id}`}
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-semibold",
          // 완료 항목은 제목에 취소선 + 흐린 색상 (PRD.md 5.5)
          todo.completed && "text-muted-foreground line-through",
        )}
      >
        {todo.title}
      </Link>

      <span
        className={cn(
          "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
          PRIORITY_CLASS[todo.priority],
        )}
      >
        {PRIORITY_LABEL[todo.priority]}
      </span>

      {todo.dueDate && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {format(new Date(todo.dueDate), "M월 d일", { locale: ko })}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="삭제"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
