"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useFlash } from "./FlashProvider";
import { api, ApiError } from "@/lib/api";
import type { DnsRecord, RecordType, RoutingPolicy } from "@/lib/types";

const recordTypes: RecordType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"];
const policies: RoutingPolicy[] = ["Simple", "Weighted", "Latency", "Failover", "Geolocation", "Multivalue"];

const hints: Record<string, string> = {
  A: "IPv4 address, for example 192.0.2.1",
  AAAA: "IPv6 address, for example 2001:db8::1",
  CNAME: "Fully qualified domain name, for example www.example.com.",
  TXT: 'Text value, enclose in quotes, for example "v=spf1 include:example.com"',
  MX: "Priority and mail server, for example 10 mail.example.com.",
  NS: "Name server, for example ns-1.awsdns-00.com.",
  PTR: "Fully qualified domain name for reverse lookup",
  SRV: "Priority weight port target, for example 10 60 5060 server.example.com.",
  CAA: 'Flags tag value, for example 0 issue "amazon.com"',
};

export function RecordModal({
  zoneId,
  zoneName,
  record,
  onClose,
  onSaved,
}: {
  zoneId: string;
  zoneName: string;
  record?: DnsRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useFlash();
  const editing = Boolean(record);
  const [name, setName] = useState(record?.name ?? "");
  const [type, setType] = useState<RecordType>((record?.type as RecordType) ?? "A");
  const [ttl, setTtl] = useState<number>(record?.ttl ?? 300);
  const [value, setValue] = useState(record?.value ?? "");
  const [policy, setPolicy] = useState<RoutingPolicy>((record?.routing_policy as RoutingPolicy) ?? "Simple");
  const [identifier, setIdentifier] = useState(record?.set_identifier ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const payload = {
      name: name.trim() || "@",
      type,
      ttl: Number(ttl),
      value: value.trim(),
      routing_policy: policy,
      set_identifier: identifier,
    };
    try {
      if (editing && record) {
        await api.updateRecord(zoneId, record.id, payload);
        push("success", "Record updated", payload.name);
      } else {
        await api.createRecord(zoneId, payload);
        push("success", "Record created", payload.name);
      }
      onSaved();
    } catch (err) {
      push("error", "Could not save record", err instanceof ApiError ? err.message : "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={editing ? "Edit record" : "Create record"}
      subtitle={zoneName}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={save}>
            {editing ? "Save record" : "Create records"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Record name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="www"
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            />
            <span className="mt-1 block text-xs text-aws-muted">
              Use @ or leave blank for the zone apex. A short label is prefixed with the zone name.
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Record type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RecordType)}
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            >
              {recordTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Value</span>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            placeholder={hints[type]}
            className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 font-mono text-sm dark:bg-aws-slate dark:text-white"
          />
          <span className="mt-1 block text-xs text-aws-muted">
            {hints[type]} &mdash; enter one value per line to add multiple values.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">TTL (seconds)</span>
            <input
              type="number"
              value={ttl}
              min={0}
              onChange={(e) => setTtl(Number(e.target.value))}
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Routing policy</span>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as RoutingPolicy)}
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            >
              {policies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {policy !== "Simple" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Set identifier</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. primary or ap-south-1"
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
            />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
