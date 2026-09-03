"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleTodo } from "@/hooks/useTodos";
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
  index: number;
  onDelete: () => void;
  isDeleting: boolean;
}

// entrance는 index로 stagger, exit는 별도 transition으로 분리해
// entrance의 delay가 삭제(exit) 애니메이션에 섞여 들어가지 않게 한다.
const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay: index * 0.03, ease: "easeOut" },
  }),
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export function TodoItem({ todo, index, onDelete, isDeleting }: TodoItemProps) {
  const toggleMutation = useToggleTodo(todo.id);
  const shouldReduceMotion = useReducedMotion();
  const checkboxScopeRef = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);

  // 완료 상태가 실제로 바뀔 때만 펄스를 재생한다(마운트 시에는 재생하지 않는다).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (shouldReduceMotion || !checkboxScopeRef.current) return;
    animate(checkboxScopeRef.current, { scale: [1, 1.2, 1] }, { duration: 0.2, ease: "easeOut" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo.completed]);

  return (
    <motion.li
      className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4"
      custom={index}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      exit={shouldReduceMotion ? { opacity: 0, height: 0 } : "exit"}
      variants={listItemVariants}
      layout={!shouldReduceMotion}
    >
      <span ref={checkboxScopeRef} className="inline-flex">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => toggleMutation.mutate(checked === true)}
          aria-label={todo.completed ? "완료 취소" : "완료로 표시"}
        />
      </span>

      {/* 제목을 누르면 확인(읽기 전용) 화면으로 간다. 수정은 아래 별도 버튼으로만 들어간다. */}
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

      <Button variant="ghost" size="icon-xs" aria-label="수정" asChild>
        <Link href={`/todos/${todo.id}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="삭제" disabled={isDeleting}>
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.li>
  );
}
