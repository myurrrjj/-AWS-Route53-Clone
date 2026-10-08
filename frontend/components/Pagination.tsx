"use client";

import { classNames } from "@/lib/format";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-aws-muted">
      <div className="flex items-center gap-2">
        <span>
          Showing {start}-{end} of {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="aws-focus rounded-sm border border-aws-border bg-white px-2 py-1 text-aws-text dark:border-aws-slate dark:bg-aws-slate dark:text-white"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPage(1)} label="First" />
        <PageButton disabled={page <= 1} onClick={() => onPage(page - 1)} label="Prev" />
        <span className="px-3">
          Page {page} of {pages}
        </span>
        <PageButton disabled={page >= pages} onClick={() => onPage(page + 1)} label="Next" />
        <PageButton disabled={page >= pages} onClick={() => onPage(pages)} label="Last" />
      </div>
    </div>
  );
}

function PageButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "aws-focus rounded-sm border border-aws-border bg-white px-2.5 py-1 dark:border-aws-slate dark:bg-aws-slate dark:text-white",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-aws-bg",
      )}
    >
      {label}
    </button>
  );
}
