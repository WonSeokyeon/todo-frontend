import { Skeleton as SkeletonBase } from "@/components/ui/skeleton";

// 로딩 상태는 스피너 대신 항목형 스켈레톤 3개를 쓴다 (CLAUDE.md 9장).
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <SkeletonBase className="h-4 w-2/3" />
          <SkeletonBase className="h-3 w-full" />
          <SkeletonBase className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Tiptap(TodoEditor)은 무겁기 때문에(ProseMirror 포함 약 230kB+) TodoForm에서
// next/dynamic으로 지연 로드한다. 로드되는 동안 실제 에디터와 같은 크기의 스켈레톤을
// 보여줘 레이아웃 시프트를 막는다(툴바 버튼 10개 + 본문 min-h-40, TodoEditor.tsx 참조).
export function EditorSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-input"
      role="status"
      aria-label="에디터 불러오는 중"
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBase key={i} className="size-7 rounded-md" />
        ))}
      </div>
      <SkeletonBase className="h-40 w-full rounded-none" />
    </div>
  );
}

// /todos/[id] 로딩 중에는 폼 형태 스켈레톤을 보여준다 (UX-01).
export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="불러오는 중">
      <SkeletonBase className="h-9 w-full" />
      <SkeletonBase className="h-40 w-full" />
      <div className="flex gap-4">
        <SkeletonBase className="h-9 flex-1" />
        <SkeletonBase className="h-9 flex-1" />
      </div>
    </div>
  );
}
