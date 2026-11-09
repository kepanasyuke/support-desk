import { useCallback, useEffect, useState } from "react";
import {
  AiPanel,
  Alert,
  AppShell,
  Badge,
  Button,
  Card,
  CardBody,
  CardHead,
  Empty,
  PageHead,
  Score,
  Select,
  Spinner,
  Stat,
  Table,
} from "@sd/ui";
import { api, type InboxStats, type Intent, type Message } from "./api";

const NAV = [
  { id: "inbox", label: "Входящие" },
  { id: "stats", label: "Аналитика" },
];

const CHANNELS = ["telegram", "whatsapp", "email", "vk", "chat"];

const CHANNEL_TONE: Record<string, "info" | "success" | "warning" | "primary" | "accent"> = {
  telegram: "info",
  whatsapp: "success",
  email: "primary",
  vk: "accent",
  chat: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Новое",
  assigned: "Назначено",
  closed: "Закрыто",
};

const STATUS_TONE: Record<string, "info" | "primary" | "neutral"> = {
  new: "info",
  assigned: "primary",
  closed: "neutral",
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [view, setView] = useState("inbox");
  const [channel, setChannel] = useState("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [selected, setSelected] = useState<Message | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.messages(), api.stats()]);
    setMessages(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  function open(message: Message): void {
    setSelected(message);
    setIntent(null);
  }

  async function classify(): Promise<void> {
    if (selected) {
      setIntent(await api.classify(selected.id));
      await refresh();
    }
  }

  async function close(message: Message): Promise<void> {
    setSelected(await api.setStatus(message.id, "closed"));
    await refresh();
  }

  const visible = channel === "all" ? messages : messages.filter((item) => item.channel === channel);

  return (
    <AppShell
      brand="Inbox"
      subtitle="Все каналы в одном окне"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {view === "inbox" ? (
        <>
          <PageHead
            title="Единый инбокс"
            description="Telegram, WhatsApp, email, VK и чат на сайте в одной ленте"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{visible.length} сообщений</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Без маршрута" value={stats?.unrouted ?? 0} hint="ждёт AI-разметки" />
            <Stat label="Новых" value={countStatus(messages, "new")} />
            <Stat label="Каналов" value={CHANNELS.length} />
          </div>
          <Card>
            <CardHead
              title="Лента"
              actions={
                <Select value={channel} onChange={(event) => setChannel(event.target.value)}>
                  <option value="all">Все каналы</option>
                  {CHANNELS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              }
            />
            {visible.length ? (
              <Table head={["Канал", "Автор", "Сообщение", "Статус", "Намерение"]}>
                {visible.map((message) => (
                  <tr key={message.id} onClick={() => open(message)} style={{ cursor: "pointer" }}>
                    <td><Badge tone={CHANNEL_TONE[message.channel] ?? "neutral"}>{message.channel}</Badge></td>
                    <td className="sd-strong">{message.author}</td>
                    <td className="sd-muted">{trim(message.text)}</td>
                    <td><Badge tone={STATUS_TONE[message.status]}>{STATUS_LABEL[message.status]}</Badge></td>
                    <td className="sd-muted">{message.ai_intent ?? "—"}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty title="Сообщений нет" description="Запустите php projects/02-inbox/api/seed.php" />
            )}
          </Card>
          {selected ? (
            <Card>
              <CardHead
                title={selected.author}
                actions={<Button size="sm" variant="secondary" onClick={() => close(selected)}>Закрыть обращение</Button>}
              />
              <CardBody className="sd-stack">
                <div className="sd-row sd-muted">
                  <Badge tone={CHANNEL_TONE[selected.channel] ?? "neutral"}>{selected.channel}</Badge>
                  <span>{selected.created_at}</span>
                </div>
                <p style={{ margin: 0 }}>{selected.text}</p>
                <AiPanel
                  title="AI-маршрутизация"
                  action={<Button size="sm" variant="primary" onClick={classify}>Определить намерение</Button>}
                >
                  {intent ? (
                    <div className="sd-stack">
                      <div className="sd-row sd-row--between">
                        <span>Намерение: <strong>{intent.intent}</strong></span>
                        <Badge tone="primary">{percent(intent.confidence)}</Badge>
                      </div>
                      <Score value={intent.confidence * 100} />
                      <span className="sd-muted">Маршрут: {intent.route_to}</span>
                      <span className="sd-subtle">провайдер: {intent.provider}</span>
                    </div>
                  ) : (
                    <span className="sd-muted">Модель определит тему и предложит маршрут.</span>
                  )}
                </AiPanel>
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <PageHead title="Аналитика каналов" description="Откуда приходят обращения и как они распределяются" />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Назначено" value={countStatus(messages, "assigned")} />
            <Stat label="Закрыто" value={countStatus(messages, "closed")} />
            <Stat label="Без маршрута" value={stats?.unrouted ?? 0} />
          </div>
          <div className="sd-grid">
            <Card>
              <CardHead title="По каналам" />
              <CardBody className="sd-stack">
                {(stats?.by_channel ?? []).map((row) => (
                  <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                    <div className="sd-row sd-row--between">
                      <Badge tone={CHANNEL_TONE[row.label] ?? "neutral"}>{row.label}</Badge>
                      <span className="sd-num">{row.total}</span>
                    </div>
                    <Score value={share(row.total, stats?.total ?? 0)} />
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHead title="По намерениям" />
              <CardBody className="sd-stack">
                {(stats?.by_intent ?? []).filter((row) => row.label).length ? (
                  (stats?.by_intent ?? []).filter((row) => row.label).map((row) => (
                    <div key={row.label} className="sd-row sd-row--between">
                      <span className="sd-muted">{row.label}</span>
                      <span className="sd-num">{row.total}</span>
                    </div>
                  ))
                ) : (
                  <Empty title="Разметки пока нет" description="Нажмите «Определить намерение» в ленте" />
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function countStatus(messages: Message[], status: string): number {
  return messages.filter((message) => message.status === status).length;
}

function trim(text: string): string {
  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
}

function share(part: string, total: number): number {
  return total > 0 ? (Number(part) / total) * 100 : 0;
}
