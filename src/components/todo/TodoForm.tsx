"use client";

import { useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditorSkeleton } from "@/components/common/Skeleton";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { validateContentLength, validateTitle } from "@/lib/validation";
import type { Priority } from "@/types/todo";

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

export interface TodoFormValues {
  title: string;
  content: string;
  priority: Priority;
  dueDate: string | null;
}

interface TodoFormProps {
  initialValues?: TodoFormValues;
  onSubmit: (values: TodoFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  submitError?: string | null;
}

// Tiptap(+ProseMirror)이 First Load JS를 크게 늘리므로(약 230kB+) 클라이언트 전용으로
// 지연 로드한다. 이 폼은 이미 "use client" 페이지에서만 쓰이므로 ssr:false로 안전하다.
const TodoEditor = dynamic(() => import("@/components/todo/TodoEditor").then((m) => m.TodoEditor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const DEFAULT_VALUES: TodoFormValues = {
  title: "",
  content: "",
  priority: "MEDIUM",
  dueDate: null,
};

// /todos/new와 /todos/[id]가 재사용한다. 완료 체크박스는 여기 두지 않는다 — 완료는 목록에서만 바꾼다.
export function TodoForm({
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
  submitError,
}: TodoFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? DEFAULT_VALUES.title);
  const [content, setContent] = useState(initialValues?.content ?? DEFAULT_VALUES.content);
  const [priority, setPriority] = useState<Priority>(
    initialValues?.priority ?? DEFAULT_VALUES.priority,
  );
  const [dueDate, setDueDate] = useState<string | null>(
    initialValues?.dueDate ?? DEFAULT_VALUES.dueDate,
  );
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // 제목·우선순위·마감일의 초기 스냅샷은 마운트 시점 값으로 고정한다(리렌더에 흔들리지 않도록 ref).
  const initialSnapshotRef = useRef({
    title: initialValues?.title ?? DEFAULT_VALUES.title,
    priority: initialValues?.priority ?? DEFAULT_VALUES.priority,
    dueDate: initialValues?.dueDate ?? DEFAULT_VALUES.dueDate,
  });
  // 본문은 서버 원본과 비교하면 안 된다 — Tiptap이 정규화하므로, setContent() 직후
  // TodoEditor가 알려주는 값(=onReady)이 준비되기 전까지는 dirty 판정을 보류한다.
  const [contentBaseline, setContentBaseline] = useState<string | null>(null);

  const isDirty =
    contentBaseline !== null &&
    (title !== initialSnapshotRef.current.title ||
      priority !== initialSnapshotRef.current.priority ||
      dueDate !== initialSnapshotRef.current.dueDate ||
      content !== contentBaseline);

  const { confirmLeave } = useLeaveGuard(isDirty);

  const titleError =
    title.length > 0 && !validateTitle(title) ? "제목은 1~200자여야 합니다." : null;
  const canSubmit =
    validateTitle(title) && validateContentLength(content) && !isSubmitting && !isDeleting;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title, content, priority, dueDate });
  }

  function handleCancel() {
    if (confirmLeave()) onCancel();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="todo-title">제목</Label>
        <Input
          id="todo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!titleError}
          maxLength={200}
          required
        />
        {titleError && (
          <p role="alert" className="text-xs text-destructive">
            {titleError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="todo-content">본문</Label>
        <TodoEditor content={content} onChange={setContent} onReady={setContentBaseline} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="todo-priority">우선순위</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger id="todo-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="todo-due-date">마감일</Label>
          <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="todo-due-date"
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
              >
                <CalendarIcon className="size-4" />
                {dueDate
                  ? format(new Date(dueDate), "yyyy년 M월 d일", { locale: ko })
                  : "마감일 선택"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ko}
                selected={dueDate ? new Date(dueDate) : undefined}
                onSelect={(date) => {
                  setDueDate(date ? format(date, "yyyy-MM-dd") : null);
                  setDueDateOpen(false);
                }}
              />
              {dueDate && (
                <div className="border-t border-border p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDueDate(null);
                      setDueDateOpen(false);
                    }}
                  >
                    마감일 지우기
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isSubmitting || isDeleting}
                className="mr-auto"
              >
                삭제
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
        )}
        <Button type="button" variant="outline" onClick={handleCancel}>
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
