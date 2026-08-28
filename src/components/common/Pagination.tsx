"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number; // 0부터 시작
  totalPages: number;
  onPageChange: (page: number) => void;
}

// 페이지 수가 1 이하면 아무것도 렌더하지 않는다 (CLAUDE.md 9장, UX-05).
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        aria-label="처음 페이지"
      >
        처음
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label="이전 페이지"
      >
        이전
      </Button>

      {/* 모바일은 "3 / 12" 형태로 축약, 데스크톱은 주변 페이지 번호를 노출한다 */}
      <span className="mx-1 text-sm text-muted-foreground sm:hidden">
        {currentPage + 1} / {totalPages}
      </span>
      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page + 1}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        aria-label="다음 페이지"
      >
        다음
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1}
        aria-label="마지막 페이지"
      >
        마지막
      </Button>
    </nav>
  );
}

function visiblePages(currentPage: number, totalPages: number): number[] {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, currentPage - half);
  const end = Math.min(totalPages, start + windowSize);
  start = Math.max(0, end - windowSize);
  return Array.from({ length: end - start }, (_, i) => start + i);
}
