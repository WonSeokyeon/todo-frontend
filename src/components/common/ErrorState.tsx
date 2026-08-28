import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  /** 필수 prop. 선택으로 두면 호출부에서 빠뜨려도 타입 검사가 통과한다 (CLAUDE.md 9장, UX-04). */
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
