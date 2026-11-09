export type Draft = {
  id: number;
  ticket_subject: string;
  ticket_body: string;
  tone: "friendly" | "formal" | "short";
  draft_text: string;
  provider: string;
  accepted: number;
  created_at: string;
};

export type GroupRow = { label: string; total: string };

export type DraftStats = {
  total: number;
  accepted: number;
  acceptance_rate: number;
  by_tone: GroupRow[];
};

export type Generated = {
  id: number;
  draft: string;
  tone: string;
  provider: string;
  model: string;
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

export type GenerateInput = { subject: string; body: string; tone: string };

export const api = {
  drafts: () => request<Draft[]>("/drafts?per-page=50"),
  stats: () => request<DraftStats>("/drafts/stats"),
  generate: (input: GenerateInput) =>
    request<Generated>("/drafts/generate", { method: "POST", body: JSON.stringify(input) }),
  regenerate: (id: number) => request<Generated>(`/drafts/${id}/ai`, { method: "POST" }),
  accept: (id: number) => request<Draft>(`/drafts/${id}`, { method: "PUT", body: JSON.stringify({ accepted: 1 }) }),
};
