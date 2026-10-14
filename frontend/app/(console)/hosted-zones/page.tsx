"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";
import { useFlash } from "@/components/FlashProvider";
import { api, ApiError } from "@/lib/api";
import { formatDate, shortId } from "@/lib/format";
import { HostedZone, Page } from "@/lib/types";

export default function HostedZonesPage() {
  const { push } = useFlash();
  const router = useRouter();
  const [data, setData] = useState<Page<HostedZone> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [confirm, setConfirm] = useState<HostedZone | null>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.zones({ q:debouncedQ, type, page, page_size: pageSize });
      setData(res);
      setSelected([]);
    } catch (err) {
      push("error", "Could not load hosted zones", err instanceof ApiError ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, type, page, pageSize, push]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleAll() {
    if (!data) return;
    setSelected(selected.length === data.items.length ? [] : data.items.map((z) => z.id));
  }

  async function removeZone(zone: HostedZone) {
    try {
      await api.deleteZone(zone.id);
      push("success", "Hosted zone deleted", `${zone.name} has been removed.`);
      setConfirm(null);
      load();
    } catch (err) {
      push("error", "Delete failed", err instanceof ApiError ? err.message : "");
    }
  }

  async function removeSelected() {
    try {
      for (const id of selected) await api.deleteZone(id);
      push("success", `${selected.length} hosted zone(s) deleted`);
      load();
    } catch (err) {
      push("error", "Bulk delete failed", err instanceof ApiError ? err.message : "");
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Hosted zones" }]}
        title="Hosted zones"
        description="A hosted zone is a container for records, which include information about how you want to route traffic for a domain and its subdomains."
        actions={
          <>
            <Button onClick={load}>Refresh</Button>
            <Button variant="danger" disabled={selected.length === 0} onClick={removeSelected}>
              Delete
            </Button>
            <Button variant="primary" onClick={() => router.push("/hosted-zones/create")}>
              Create hosted zone
            </Button>
          </>
        }
      />

      <div className="rounded-sm border border-aws-border bg-white shadow-card dark:border-aws-slate dark:bg-aws-navy">
        <div className="flex flex-wrap items-center gap-3 border-b border-aws-border p-4 dark:border-aws-slate">
          <div className="relative flex-1 min-w-[240px]">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name or comment"
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            />
          </div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="aws-focus rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
          >
            <option value="">All types</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8">
            <Spinner label="Loading hosted zones" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState onCreate={() => router.push("/hosted-zones/create")} />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-aws-bg text-xs uppercase text-aws-muted dark:bg-aws-slate">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === data.items.length && data.items.length > 0}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Record count</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3">Hosted zone ID</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((zone) => (
                  <tr
                    key={zone.id}
                    className="border-t border-aws-border hover:bg-aws-bg dark:border-aws-slate dark:hover:bg-aws-slate/60"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(zone.id)}
                        onChange={() => toggle(zone.id)}
                        aria-label={`Select ${zone.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/hosted-zones/${zone.id}`} className="font-medium text-aws-link hover:underline">
                        {zone.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={zone.type} />
                    </td>
                    <td className="px-4 py-3">{zone.record_count}</td>
                    <td className="px-4 py-3 text-aws-muted">{zone.comment || "\u2014"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{shortId(zone.id)}</td>
                    <td className="px-4 py-3 text-aws-muted">{formatDate(zone.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="link" onClick={() => setEditZone(zone)}>
                          Edit
                        </Button>
                        <Button variant="link" onClick={() => setConfirm(zone)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-aws-border px-4 dark:border-aws-slate">
              <Pagination
                page={data.page}
                pages={data.pages}
                total={data.total}
                pageSize={data.page_size}
                onPage={setPage}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {editZone ? (
        <EditZoneModal
          zone={editZone}
          onClose={() => setEditZone(null)}
          onSaved={() => {
            setEditZone(null);
            load();
          }}
        />
      ) : null}

      {confirm ? (
        <Modal
          open
          title="Delete hosted zone"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => removeZone(confirm)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-aws-text dark:text-gray-200">
            Are you sure you want to delete <span className="font-bold">{confirm.name}</span> and all of its{" "}
            {confirm.record_count} records? This action cannot be undone.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

function EditZoneModal({
  zone,
  onClose,
  onSaved,
}: {
  zone: HostedZone;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useFlash();
  const [comment, setComment] = useState(zone.comment);
  const [type, setType] = useState(zone.type);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.updateZone(zone.id, { comment, type });
      push("success", "Hosted zone updated", zone.name);
      onSaved();
    } catch (err) {
      push("error", "Update failed", err instanceof ApiError ? err.message : "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Edit hosted zone"
      subtitle={zone.name}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Comment</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Public" | "Private")}
            className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
          >
            <option value="Public">Public hosted zone</option>
            <option value="Private">Private hosted zone</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded-full border border-aws-border bg-aws-bg px-2 py-0.5 text-xs font-bold text-aws-steel dark:bg-aws-slate dark:text-gray-200">
      {type}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-12 text-center">
      <h3 className="text-lg font-bold text-aws-text dark:text-white">No hosted zones</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-aws-muted">
        You don&apos;t have any hosted zones yet. Create one to start managing DNS records for your domain.
      </p>
      <div className="mt-4 flex justify-center">
        <Button variant="primary" onClick={onCreate}>
          Create hosted zone
        </Button>
      </div>
    </div>
  );
}
