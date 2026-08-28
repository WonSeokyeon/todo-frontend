import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

// 빈 상태: 아이콘 + 문구 + CTA 버튼 (CLAUDE.md 9장). "검색 결과 없음"은 title만 다르게 넘겨 재사용한다.
export function EmptyState({ icon, title, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{title}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
