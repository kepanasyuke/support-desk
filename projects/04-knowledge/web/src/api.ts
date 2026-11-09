export type Article = {
  id: number;
  title: string;
  body: string;
  category: string;
  tags: string;
  views: number;
  updated_at: string;
};

export type GroupRow = { label: string; total: string; views: string };

export type PopularRow = { id: number; title: string; category: string; views: number };

export type KbStats = {
  total: number;
  by_category: GroupRow[];
  popular: PopularRow[];
};

export type Hit = {
  id: number;
  title: string;
  category: string;
  score: number;
};

export type SearchResult = {
  query: string;
  suggested_category: string;
  category_confidence: number;
  articles: Hit[];
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
  articles: () => request<Article[]>("/articles?per-page=50"),
  stats: () => request<KbStats>("/articles/stats"),
  search: (query: string) => request<SearchResult>(`/articles/search?q=${encodeURIComponent(query)}`),
  similar: (id: number) => request<SearchResult>(`/articles/${id}/ai`, { method: "POST" }),
};
