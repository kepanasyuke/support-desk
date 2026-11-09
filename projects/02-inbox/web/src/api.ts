export type Message = {
  id: number;
  channel: string;
  author: string;
  text: string;
  direction: string;
  status: "new" | "assigned" | "closed";
  ai_intent: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type GroupRow = { label: string; total: string };

export type InboxStats = {
  total: number;
  by_channel: GroupRow[];
  by_status: GroupRow[];
  by_intent: GroupRow[];
  unrouted: number;
};

export type Intent = {
  message_id: number;
  channel: string;
  intent: string;
  confidence: number;
  route_to: string;
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
  messages: () => request<Message[]>("/messages?per-page=50"),
  stats: () => request<InboxStats>("/messages/stats"),
  classify: (id: number) => request<Intent>(`/messages/${id}/ai`, { method: "POST" }),
  setStatus: (id: number, status: string) =>
    request<Message>(`/messages/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
};
