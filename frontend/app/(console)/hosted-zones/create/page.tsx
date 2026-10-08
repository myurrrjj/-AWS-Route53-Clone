"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { useFlash } from "@/components/FlashProvider";
import { api, ApiError } from "@/lib/api";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { push } = useFlash();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!name.trim()) {
      setError("Enter a domain name.");
      return false;
    }
    setError("");
    return true;
  }

  async function create() {
    setBusy(true);
    try {
      const zone = await api.createZone({ name: name.trim(), comment, type });
      push("success", "Hosted zone created", zone.name);
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err) {
      push("error", "Could not create hosted zone", err instanceof ApiError ? err.message : "");
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: "Create hosted zone" },
        ]}
        title="Create hosted zone"
        description="A hosted zone tells Route 53 how to respond to DNS queries for a domain and its subdomains."
      />

      <div className="mb-6 flex items-center gap-4 text-sm">
        <StepDot n={1} label="Configure hosted zone" active={step === 1} done={step > 1} />
        <span className="h-px w-10 bg-aws-border" />
        <StepDot n={2} label="Review" active={step === 2} done={false} />
      </div>

      <div className="max-w-3xl rounded-sm border border-aws-border bg-white p-6 shadow-card dark:border-aws-slate dark:bg-aws-navy">
        {step === 1 ? (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Domain name</span>
              <p className="mb-2 text-xs text-aws-muted">
                This is the name of the domain that you want to route traffic for. Example: example.com
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example.com"
                className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm dark:bg-aws-slate dark:text-white"
              />
              {error ? <p className="mt-1 text-xs text-aws-red">{error}</p> : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-aws-text dark:text-white">Description</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Optional comment about this hosted zone"
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

            <div className="flex justify-end gap-2 border-t border-aws-border pt-4 dark:border-aws-slate">
              <Button onClick={() => router.push("/hosted-zones")}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (validate()) setStep(2);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Review label="Domain name" value={name} />
            <Review label="Type" value={`${type} hosted zone`} />
            <Review label="Description" value={comment || "\u2014"} />
            <div className="flex justify-end gap-2 border-t border-aws-border pt-4 dark:border-aws-slate">
              <Button onClick={() => setStep(1)}>Previous</Button>
              <Button variant="primary" disabled={busy} onClick={create}>
                {busy ? "Creating..." : "Create hosted zone"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
          active || done ? "bg-aws-blue text-white" : "bg-aws-border text-aws-muted"
        }`}
      >
        {n}
      </span>
      <span className={active ? "font-bold text-aws-text dark:text-white" : "text-aws-muted"}>{label}</span>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-aws-border pb-3 dark:border-aws-slate sm:flex-row sm:gap-6">
      <span className="w-40 text-sm font-bold text-aws-muted">{label}</span>
      <span className="text-sm text-aws-text dark:text-gray-200">{value}</span>
    </div>
  );
}
