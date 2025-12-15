import { http } from "./http";
import type {
  Page,
  Client,
  ApplicationRow,
  BatchRow,
  CardRow,
  MetaPayload,
  FunnelReport,
  VolumeReport,
  SlaReport,
  RejectReasonsReport,
} from "./types";

function normalizeDates<T extends Record<string, any>>(payload: T): T {
  const p: any = { ...payload };
  for (const k of Object.keys(p)) {
    const v = p[k];
    if (v === "") {
      // Pydantic date fields reject empty string -> send null instead
      if (k === "birth_date" || k.endsWith("_date")) p[k] = null;
    }
  }
  return p;
}

export async function getMeta(): Promise<MetaPayload> {
  const { data } = await http.get("/api/meta");
  return data;
}

// ---------- Clients ----------
export async function listClients(q: string, limit: number, offset: number): Promise<Page<Client>> {
  const { data } = await http.get("/api/clients", { params: { q: q || undefined, limit, offset } });
  return data;
}
export async function createClient(payload: Partial<Client>): Promise<Client> {
  const { data } = await http.post("/api/clients", normalizeDates(payload as any));
  return data;
}
export async function updateClient(id: string, payload: Partial<Client>): Promise<Client> {
  const { data } = await http.put(`/api/clients/${id}`, normalizeDates(payload as any));
  return data;
}

// ---------- Applications ----------
export async function listApplications(params: {
  q?: string;
  statuses?: string[];
  date_from?: string;
  date_to?: string;
  limit: number;
  offset: number;
}): Promise<Page<ApplicationRow>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  sp.set("limit", String(params.limit));
  sp.set("offset", String(params.offset));
  (params.statuses ?? []).forEach((s) => sp.append("statuses", s));
  const { data } = await http.get(`/api/applications?${sp.toString()}`);
  return data;
}

export async function createApplication(payload: any): Promise<{ id: string; application_no: string }> {
  const { data } = await http.post("/api/applications", normalizeDates(payload));
  return data;
}

export async function getApplication(appId: string): Promise<ApplicationRow> {
  const { data } = await http.get(`/api/applications/${appId}`);
  return data;
}

export async function updateApplication(appId: string, payload: any): Promise<any> {
  const { data } = await http.put(`/api/applications/${appId}`, normalizeDates(payload));
  return data;
}

export async function decideApplication(appId: string, payload: any): Promise<any> {
  const { data } = await http.post(`/api/applications/${appId}/decision`, normalizeDates(payload));
  return data;
}

export async function ensureCard(appId: string): Promise<any> {
  const { data } = await http.post(`/api/applications/${appId}/ensure-card`);
  return data;
}

// ---------- Batches ----------
export async function listBatches(limit: number, offset: number): Promise<Page<BatchRow>> {
  const { data } = await http.get("/api/batches", { params: { limit, offset } });
  return data;
}

export async function getBatch(batchId: string): Promise<any> {
  const { data } = await http.get(`/api/batches/${batchId}`);
  return data;
}


export async function getCard(cardId: string): Promise<CardRow> {
  const { data } = await http.get(`/api/cards/${cardId}`);
  return data;
}

export async function updateBatch(batchId: string, payload: any): Promise<any> {
  const { data } = await http.put(`/api/batches/${batchId}`, payload);
  return data;
}

export async function issueBatchCards(batchId: string): Promise<any> {
  const { data } = await http.post(`/api/batches/${batchId}/issue-cards`);
  return data;
}


export async function createBatch(payload: any): Promise<{ id: string; batch_no: string }> {
  const { data } = await http.post("/api/batches", normalizeDates(payload));
  return data;
}

export async function addBatchItems(batchId: string, application_ids: string[]): Promise<any> {
  const { data } = await http.post(`/api/batches/${batchId}/items`, { application_ids });
  return data;
}

export async function setBatchStatus(batchId: string, status: string): Promise<any> {
  const { data } = await http.post(`/api/batches/${batchId}/status`, null, { params: { status } });
  return data;
}

// ---------- Cards ----------
export async function listCards(limit: number, offset: number): Promise<Page<CardRow>> {
  const { data } = await http.get("/api/cards", { params: { limit, offset } });
  return data;
}

export async function cardEvent(cardId: string, payload: { event: string; by?: string }): Promise<any> {
  const { data } = await http.post(`/api/cards/${cardId}/event`, payload);
  return data;
}

// ---------- Reports ----------
export async function reportFunnel(): Promise<FunnelReport> {
  const { data } = await http.get("/api/reports/funnel");
  return data;
}
export async function reportVolume(params: { bucket?: "day" | "week" | "month" } = {}): Promise<VolumeReport> {
  const { data } = await http.get("/api/reports/volume", { params });
  return data;
}
export async function reportSla(params: { bucket?: "day" | "week" | "month" } = {}): Promise<SlaReport> {
  const { data } = await http.get("/api/reports/sla", { params });
  return data;
}
export async function reportRejectReasons(params: { bucket?: "day" | "week" | "month" } = {}): Promise<RejectReasonsReport> {
  const { data } = await http.get("/api/reports/reject-reasons", { params });
  return data;
}
