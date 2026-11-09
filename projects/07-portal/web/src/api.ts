export type ClientRequest = {
  id: number;
  client: string;
  email: string;
  subject: string;
  body: string;
  status: "new" | "in_progress" | "answered" | "closed";
  ai_category: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type GroupRow = { label: string; total: string };

export type PortalStats = {
  total: number;
  open: number;
  by_status: GroupRow[];
  by_category: GroupRow[];
};

export type Routing = {
  request_id: number;
  category: string;
  confidence: number;
  queue: string;
  eta_hours: number;
  provider: string;
};

export type NewRequest = {
  client: string;
  email: string;
  subject: string;
  body: string;
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
  requests: () => request<ClientRequest[]>("/requests?per-page=50"),
  stats: () => request<PortalStats>("/requests/stats"),
  route: (id: number) => request<Routing>(`/requests/${id}/ai`, { method: "POST" }),
  create: (input: NewRequest) => request<ClientRequest>("/requests", { method: "POST", body: JSON.stringify(input) }),
};
