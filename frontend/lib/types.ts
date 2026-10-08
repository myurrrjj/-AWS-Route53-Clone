export type User = {
  id: number;
  email: string;
  name: string;
  account_id: string;
};

export type HostedZone = {
  id: string;
  name: string;
  comment: string;
  type: "Public" | "Private";
  private_zone: boolean;
  caller_reference: string;
  created_at: string;
  record_count: number;
};

export type DnsRecord = {
  id: number;
  zone_id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
  routing_policy: string;
  set_identifier: string;
  created_at: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA";

export type RoutingPolicy =
  | "Simple"
  | "Weighted"
  | "Latency"
  | "Failover"
  | "Geolocation"
  | "Multivalue";
