export type PageMeta = { total: number; limit: number; offset: number };
export type Page<T> = { meta: PageMeta; items: T[] };

export type RefItem = { id: number; code: string; name: string; is_active: boolean };

export type Branch = RefItem & { city: string; address: string; phone?: string | null };

export type DeliveryMethod = RefItem & { base_cost?: number; sla_days?: number };

export type Vendor = {
  id: number;
  vendor_type: string;
  name: string;
  contacts?: string | null;
  sla_days: number;
  is_active: boolean;
};

export type Product = RefItem & {
  payment_system: string;
  level: string;
  currency: string;
  term_months: number;
  is_virtual: boolean;
  metadata_json: Record<string, any>;
};

export type Tariff = RefItem & {
  issue_fee: number;
  monthly_fee: number;
  annual_fee: number;
  interest_rate: number;
  grace_days: number;
  limit_min: number;
  limit_max: number;
  is_active: boolean;
};

export type Client = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  birth_date?: string | null;

  doc_type: string;
  doc_number: string;
  doc_issue_date?: string | null;
  doc_issuer?: string | null;

  reg_address?: string | null;
  fact_address?: string | null;

  segment?: string | null;
  kyc_status?: string | null;
  risk_level?: string | null;

  comment?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationRow = {
  id: string;
  application_no: string;
  requested_at: string;
  planned_issue_date?: string | null;
  requested_delivery_date?: string | null;

  priority: string;
  is_salary_project: boolean;
  embossing_name?: string | null;

  delivery_address?: string | null;
  delivery_comment?: string | null;

  kyc_score?: number | null;
  kyc_result?: string | null;

  decision_at?: string | null;
  decision_by?: string | null;

  comment?: string | null;
  created_at: string;
  updated_at: string;

  status: { id: number; code: string; name: string };
  client: Client;
  product: Product;
  tariff: Tariff;
  channel: RefItem;
  branch: Branch;
  delivery: RefItem;
  reject_reason?: RefItem | null;

  batch?: { id: string; batch_no: string; status: { id: number; code: string; name: string } } | null;
  card?: {
    id: string;
    card_no: string;
    status: { id: number; code: string; name: string };
    issued_at?: string | null;
    delivered_at?: string | null;
    handed_at?: string | null;
    activated_at?: string | null;
  } | null;
};

export type BatchRow = {
  id: string;
  batch_no: string;
  vendor: Vendor;
  status: { id: number; code: string; name: string };
  planned_send_at?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type BatchBundle = BatchRow & {
  items: {
    id: string;
    application: ApplicationRow;
    app_status: { id: number; code: string; name: string };
    client: Client;
    card?: {
      id: string;
      card_no: string;
      status: { id: number; code: string; name: string };
      issued_at?: string | null;
      delivered_at?: string | null;
      handed_at?: string | null;
      activated_at?: string | null;
    } | null;
  }[];
};

export type CardRow = {
  id: string;
  card_no: string;
  application_id: string;
  status: { id: number; code: string; name: string };

  application?: { id: string; application_no: string };
  client?: { id: string; full_name: string; phone?: string | null };
  batch?: { id: string; batch_no: string } | null;

  pan_masked?: string | null;
  expiry_month?: number | null;
  expiry_year?: number | null;

  issued_at?: string | null;
  delivered_at?: string | null;
  handed_at?: string | null;
  activated_at?: string | null;
  closed_at?: string | null;
};

export type FunnelReport = {
  applications: number;
  approved: number;
  rejected: number;
  issued: number;
  handed: number;
  activated: number;
};

export type VolumeReport = { points: { bucket: string; count: number }[] };

export type SlaReport = {
  points: { bucket: string; avg_days: number; p90_days: number; count: number }[];
};

export type RejectReasonsReport = { points: { reason: string; count: number }[] };

export type MetaPayload = {
  refs: {
    channels: RefItem[];
    branches: Branch[];
    delivery_methods: DeliveryMethod[];
    vendors: Vendor[];
    reject_reasons: RefItem[];
    products: Product[];
    tariffs: Tariff[];
  };
  server_time_utc: string;
};
