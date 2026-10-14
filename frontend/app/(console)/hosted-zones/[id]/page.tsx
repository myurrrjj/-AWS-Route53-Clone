"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/Spinner";
import { RecordModal } from "@/components/RecordModal";
import { useFlash } from "@/components/FlashProvider";
import { api, ApiError } from "@/lib/api";
import { formatDate, shortId, valueLines } from "@/lib/format";
import type { DnsRecord, HostedZone, Page } from "@/lib/types";

const typeOptions = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"];

export default function ZoneDetailPage({ params }: { params: { id: string } }) {
  const zoneId = params.id;
  const router = useRouter();
  const { push } = useFlash();
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [data, setData] = useState<Page<DnsRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState<DnsRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<DnsRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
    const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [z, recs] = await Promise.all([
        api.zone(zoneId),
        api.records(zoneId, { q:debouncedQ, type, page, page_size: pageSize }),
      ]);
      setZone(z);
      setData(recs);
      setSelected([]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        push("error", "Hosted zone not found");
        router.push("/hosted-zones");
      } else {
        push("error", "Could not load records", err instanceof ApiError ? err.message : "");
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, debouncedQ, type, page, pageSize, push, router]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function removeRecord(record: DnsRecord) {
    try {
      await api.deleteRecord(zoneId, record.id);
      push("success", "Record deleted", record.name);
      setConfirm(null);
      load();
    } catch (err) {
      push("error", "Delete failed", err instanceof ApiError ? err.message : "");
    }
  }

  async function bulkDelete() {
    try {
      const res = await api.bulkDeleteRecords(zoneId, selected);
      push("success", `${res.deleted} record(s) deleted`);
      load();
    } catch (err) {
      push("error", "Bulk delete failed", err instanceof ApiError ? err.message : "");
    }
  }

  async function exportZone(format: "json" | "bind") {
    try {
      const payload = await api.exportZone(zoneId, format);
      const text =
        format === "json"
          ? JSON.stringify(payload, null, 2)
          : String((payload as { content: string }).content);
      download(`${zone?.name ?? "zone"}.${format === "json" ? "json" : "txt"}`, text);
      push("success", "Export ready", `Downloaded ${format.toUpperCase()} export.`);
    } catch (err) {
      push("error", "Export failed", err instanceof ApiError ? err.message : "");
    }
  }

  if (loading && !zone) {
    return (
      <div className="p-8">
        <Spinner label="Loading hosted zone" />
      </div>
    );
  }

  if (!zone) return null;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone.name },
        ]}
        title={zone.name}
        description={zone.comment || "No description provided."}
        actions={
          <>
            <Button onClick={() => exportZone("json")}>Export JSON</Button>
            <Button onClick={() => exportZone("bind")}>Export BIND</Button>
            <Button onClick={() => setImportOpen(true)}>Import zone file</Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              Create record
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 rounded-sm border border-aws-border bg-white p-5 shadow-card dark:border-aws-slate dark:bg-aws-navy sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Hosted zone ID" value={shortId(zone.id)} mono />
        <Info label="Type" value={`${zone.type} hosted zone`} />
        <Info label="Record count" value={String(zone.record_count)} />
        <Info label="Created" value={formatDate(zone.created_at)} />
      </div>

      <div className="rounded-sm border border-aws-border bg-white shadow-card dark:border-aws-slate dark:bg-aws-navy">
        <div className="flex flex-wrap items-center gap-3 border-b border-aws-border p-4 dark:border-aws-slate">
          <div className="min-w-[240px] flex-1">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Filter records by name or value"
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
            <option value="">All record types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button variant="danger" disabled={selected.length === 0} onClick={bulkDelete}>
            Delete selected
          </Button>
          <Button onClick={load}>Refresh</Button>
        </div>

        {!data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-bold text-aws-text dark:text-white">No records found</h3>
            <p className="mt-2 text-sm text-aws-muted">
              Adjust your filter, or create a new record in this hosted zone.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-aws-bg text-xs uppercase text-aws-muted dark:bg-aws-slate">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === data.items.length && data.items.length > 0}
                      onChange={() =>
                        setSelected(
                          selected.length === data.items.length ? [] : data.items.map((r) => r.id),
                        )
                      }
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3">Record name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Routing</th>
                  <th className="px-4 py-3">TTL</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-aws-border align-top hover:bg-aws-bg dark:border-aws-slate dark:hover:bg-aws-slate/60"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(record.id)}
                        onChange={() => toggle(record.id)}
                        aria-label={`Select ${record.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-aws-text dark:text-gray-100">{record.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-sm bg-aws-bg px-1.5 py-0.5 font-mono text-xs font-bold text-aws-blueDark dark:bg-aws-slate dark:text-gray-100">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-aws-muted">{record.routing_policy}</td>
                    <td className="px-4 py-3 text-aws-muted">{record.ttl}</td>
                    <td className="px-4 py-3 font-mono text-xs text-aws-text dark:text-gray-200">
                      {valueLines(record.value).map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="link" onClick={() => setEditing(record)}>
                          Edit
                        </Button>
                        <Button variant="link" onClick={() => setConfirm(record)}>
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

      <div className="mt-4 text-sm text-aws-muted">
        <Link href="/hosted-zones" className="text-aws-link hover:underline">
          &larr; Back to hosted zones
        </Link>
      </div>

      {creating || editing ? (
        <RecordModal
          zoneId={zoneId}
          zoneName={zone.name}
          record={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      ) : null}

      {confirm ? (
        <Modal
          open
          title="Delete record"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => removeRecord(confirm)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-aws-text dark:text-gray-200">
            Delete the <span className="font-bold">{confirm.type}</span> record for{" "}
            <span className="font-bold">{confirm.name}</span>? This cannot be undone.
          </p>
        </Modal>
      ) : null}

      {importOpen ? (
        <ImportModal
          zoneId={zoneId}
          onClose={() => setImportOpen(false)}
          onDone={() => {
            setImportOpen(false);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function ImportModal({
  zoneId,
  onClose,
  onDone,
}: {
  zoneId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { push } = useFlash();
  const [content, setContent] = useState("$ORIGIN example.com.\n$TTL 300\nwww 300 IN A 192.0.2.1\n");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await api.importBind(zoneId, content);
      push("success", `${res.imported} record(s) imported`);
      onDone();
    } catch (err) {
      push("error", "Import failed", err instanceof ApiError ? err.message : "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Import zone file"
      subtitle="Paste a BIND zone file to bulk create records"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={run}>
            {busy ? "Importing..." : "Import records"}
          </Button>
        </>
      }
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 font-mono text-sm dark:bg-aws-slate dark:text-white"
      />
    </Modal>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-aws-muted">{label}</p>
      <p className={`mt-1 text-sm text-aws-text dark:text-gray-100 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
