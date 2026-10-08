import type { DnsRecord, HostedZone, Page, User } from "./types";

const base = process.env.NEXT_PUBLIC_API_BASE ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join(", ")
      : detail || "Request failed";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) =>
    request<User>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/auth/me"),

  zones: (params: Record<string, string | number> = {}) =>
    request<Page<HostedZone>>(`/api/hosted-zones?${new URLSearchParams(asStrings(params))}`),
  zone: (id: string) => request<HostedZone>(`/api/hosted-zones/${id}`),
  createZone: (body: { name: string; comment: string; type: string }) =>
    request<HostedZone>("/api/hosted-zones", { method: "POST", body: JSON.stringify(body) }),
  updateZone: (id: string, body: { comment?: string; type?: string }) =>
    request<HostedZone>(`/api/hosted-zones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteZone: (id: string) => request<void>(`/api/hosted-zones/${id}`, { method: "DELETE" }),
  exportZone: (id: string, format: "json" | "bind") =>
    request<Record<string, unknown>>(`/api/hosted-zones/${id}/export?format=${format}`),

  records: (zoneId: string, params: Record<string, string | number> = {}) =>
    request<Page<DnsRecord>>(
      `/api/hosted-zones/${zoneId}/records?${new URLSearchParams(asStrings(params))}`,
    ),
  createRecord: (zoneId: string, body: Partial<DnsRecord>) =>
    request<DnsRecord>(`/api/hosted-zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateRecord: (zoneId: string, id: number, body: Partial<DnsRecord>) =>
    request<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteRecord: (zoneId: string, id: number) =>
    request<void>(`/api/hosted-zones/${zoneId}/records/${id}`, { method: "DELETE" }),
  bulkDeleteRecords: (zoneId: string, ids: number[]) =>
    request<{ deleted: number }>(`/api/hosted-zones/${zoneId}/records/bulk-delete`, {
      method: "POST",
      body: JSON.stringify(ids),
    }),
  importBind: (zoneId: string, content: string) =>
    request<{ imported: number }>(`/api/hosted-zones/${zoneId}/records/import-bind`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

function asStrings(params: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== "" && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  );
}
