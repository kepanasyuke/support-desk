export type Survey = {
  id: number;
  client: string;
  score: number;
  comment: string;
  channel: string;
  operator: string;
  ai_sentiment: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type DistributionRow = { label: string; total: string };
export type ChannelRow = { label: string; total: string; avg_score: string };

export type CsatStats = {
  total: number;
  average: number;
  promoters: number;
  detractors: number;
  distribution: DistributionRow[];
  by_channel: ChannelRow[];
  by_operator: ChannelRow[];
};

export type Sentiment = {
  survey_id: number;
  sentiment: string;
  confidence: number;
  score: number;
  verdict: string;
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
  surveys: () => request<Survey[]>("/surveys?per-page=50"),
  stats: () => request<CsatStats>("/surveys/stats"),
  analyse: (id: number) => request<Sentiment>(`/surveys/${id}/ai`, { method: "POST" }),
  analyseAll: () => request<Sentiment[]>("/surveys/analyse-all", { method: "POST" }),
};
