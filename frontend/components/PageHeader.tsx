import Link from "next/link";

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
}: {
  breadcrumbs?: { label: string; href?: string }[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {breadcrumbs?.length ? (
        <nav className="mb-2 flex items-center gap-1 text-sm text-aws-link">
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex items-center gap-1">
              {b.href ? (
                <Link href={b.href} className="hover:underline">
                  {b.label}
                </Link>
              ) : (
                <span className="text-aws-muted">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 ? <span className="text-aws-muted">/</span> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-aws-text dark:text-white">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-aws-muted dark:text-gray-300">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
