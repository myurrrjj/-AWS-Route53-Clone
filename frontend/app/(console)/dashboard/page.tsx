"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { HostedZone } from "@/lib/types";

export default function DashboardPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .zones({ page_size: 100 })
      .then((res) => setZones(res.items))
      .finally(() => setLoading(false));
  }, []);

  const totalRecords = zones.reduce((sum, z) => sum + z.record_count, 0);
  const publicZones = zones.filter((z) => z.type === "Public").length;
  const privateZones = zones.filter((z) => z.type === "Private").length;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Dashboard" }]}
        title="Route 53 dashboard"
        description="An overview of the DNS resources in your account."
      />

      {loading ? (
        <Spinner label="Loading dashboard" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Hosted zones" value={zones.length} />
            <Stat label="DNS records" value={totalRecords} />
            <Stat label="Public zones" value={publicZones} />
            <Stat label="Private zones" value={privateZones} />
          </div>

          <div className="mt-6 rounded-sm border border-aws-border bg-white shadow-card dark:border-aws-slate dark:bg-aws-navy">
            <div className="flex items-center justify-between border-b border-aws-border px-5 py-3 dark:border-aws-slate">
              <h2 className="text-sm font-bold uppercase tracking-wide text-aws-muted">Recently created zones</h2>
              <Link href="/hosted-zones" className="text-sm text-aws-link hover:underline">
                View all hosted zones
              </Link>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-aws-bg text-xs uppercase text-aws-muted dark:bg-aws-slate">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Records</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {zones.slice(0, 5).map((zone) => (
                  <tr key={zone.id} className="border-t border-aws-border dark:border-aws-slate">
                    <td className="px-5 py-3">
                      <Link href={`/hosted-zones/${zone.id}`} className="text-aws-link hover:underline">
                        {zone.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{zone.type}</td>
                    <td className="px-5 py-3">{zone.record_count}</td>
                    <td className="px-5 py-3 text-aws-muted">{formatDate(zone.created_at)}</td>
                  </tr>
                ))}
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-aws-muted">
                      No hosted zones yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-aws-border bg-white p-5 shadow-card dark:border-aws-slate dark:bg-aws-navy">
      <p className="text-xs uppercase tracking-wide text-aws-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-aws-text dark:text-white">{value}</p>
    </div>
  );
}
