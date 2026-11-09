export type Operator = {
  id: number;
  name: string;
  team: string;
  open_tickets: number;
  resolved_today: number;
  avg_response_min: number;
  capacity: number;
  ai_advice: string | null;
  created_at: string;
};

export type TeamRow = {
  label: string;
  total: string;
  open_tickets: string;
  resolved_today: string;
};

export type WorkloadStats = {
  total: number;
  open_total: number;
  resolved_total: number;
  average_utilisation: number;
  overloaded: number;
  by_team: TeamRow[];
};

export type Advice = {
  operator_id: number;
  name: string;
  utilisation: number;
  band: string;
  advice: string;
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
  operators: () => request<Operator[]>("/operators?per-page=50"),
  stats: () => request<WorkloadStats>("/operators/stats"),
  advise: (id: number) => request<Advice>(`/operators/${id}/ai`, { method: "POST" }),
};
