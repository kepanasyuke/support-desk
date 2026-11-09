export type Ticket = {
  id: number;
  subject: string;
  body: string;
  client: string;
  channel: string;
  status: "new" | "open" | "pending" | "resolved";
  priority: "low" | "normal" | "high" | "urgent";
  assignee: string | null;
  ai_label: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type GroupRow = { label: string; total: string };

export type Stats = {
  total: number;
  by_status: GroupRow[];
  by_priority: GroupRow[];
  ai_labeled: number;
};

export type Triage = {
  ticket_id: number;
  label: string;
  confidence: number;
  priority: string;
  provider: string;
};

export type Suggest = {
  ticket_id: number;
  draft: string;
  provider: string;
  label: string | null;
};

function headers(): HeadersInit {
  return { "Content-Type": "application/json" };
}

function fail(path: string, status: number): never {
  throw new Error(`Запрос ${path} завершился с кодом ${status}`);
}

async function parse<T>(response: Response, path: string): Promise<T> {
  return response.ok ? ((await response.json()) as T) : fail(path, response.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return parse(await fetch(`/api${path}`, { headers: headers(), ...init }), path);
}

export const api = {
  tickets: () => request<Ticket[]>("/tickets?per-page=50"),
  stats: () => request<Stats>("/tickets/stats"),
  triage: (id: number) => request<Triage>(`/tickets/${id}/triage`, { method: "POST" }),
  suggest: (id: number, tone: string) =>
    request<Suggest>(`/tickets/${id}/suggest`, { method: "POST", body: JSON.stringify({ tone }) }),
  setStatus: (id: number, status: string) =>
    request<Ticket>(`/tickets/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
};
