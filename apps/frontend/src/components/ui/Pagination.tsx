'use client';

import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  meta: {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    total: number;
  };
  onPage: (page: number) => void;
}

export function Pagination({ meta, onPage }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-400">
        Page {meta.page} of {meta.totalPages} ({meta.total} items)
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPage(meta.page - 1)}
          icon={<ChevronLeft className="h-4 w-4" />}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPage(meta.page + 1)}
          icon={<ChevronRight className="h-4 w-4" />}
          iconPosition="right"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
