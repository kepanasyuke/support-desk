export type SlaItem = {
  id: number;
  subject: string;
  client: string;
  priority: "standard" | "high" | "critical";
  limit_min: number;
  elapsed_min: number;
  status: "running" | "paused" | "met" | "breached";
  ai_risk: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type GroupRow = { label: string; total: string };

export type RunningRow = { id: number; subject: string; limit_min: number; elapsed_min: number };

export type SlaStats = {
  total: number;
  by_status: GroupRow[];
  by_priority: GroupRow[];
  overdue: number;
  running: RunningRow[];
};

export type Risk = {
  sla_id: number;
  risk: string;
  confidence: number;
  remaining_min: number;
  recommendation: string;
  provider: string;
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
  items: () => request<SlaItem[]>("/slas?per-page=50"),
  stats: () => request<SlaStats>("/slas/stats"),
  assess: (id: number) => request<Risk>(`/slas/${id}/ai`, { method: "POST" }),
  pause: (id: number) =>
    request<SlaItem>(`/slas/${id}`, { method: "PUT", body: JSON.stringify({ status: "paused" }) }),
};
