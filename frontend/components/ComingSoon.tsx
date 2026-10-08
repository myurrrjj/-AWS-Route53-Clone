import Link from "next/link";
import { PageHeader } from "./PageHeader";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Route 53", href: "/hosted-zones" }, { label: title }]}
        title={title}
        description={description}
      />
      <div className="rounded-sm border border-aws-border bg-white p-12 text-center shadow-card dark:border-aws-slate dark:bg-aws-navy">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-aws-bg text-2xl dark:bg-aws-slate">
          <span>&#8987;</span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-aws-text dark:text-white">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-aws-muted">
          {title} is not part of this assignment build. The hosted zones and DNS record
          workflows are fully functional &mdash; head there to manage your zones.
        </p>
        <div className="mt-5">
          <Link
            href="/hosted-zones"
            className="inline-flex rounded-sm bg-aws-orange px-4 py-2 text-sm font-bold text-aws-text hover:bg-aws-orangeDark"
          >
            Go to hosted zones
          </Link>
        </div>
      </div>
    </div>
  );
}
