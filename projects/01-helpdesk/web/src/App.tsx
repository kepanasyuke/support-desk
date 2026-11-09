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
  Field,
  PageHead,
  Score,
  Select,
  Spinner,
  Stat,
  Table,
  Textarea,
  Tip,
  HelpdeskArt,
  channelLabel,
} from "@sd/ui";
import { api, type Stats, type Suggest, type Ticket, type Triage } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "tickets", label: "Обращения" },
  { id: "stats", label: "Аналитика" },
];

const STATUS_LABEL: Record<string, string> = {
  new: "Новое",
  open: "В работе",
  pending: "Ожидание",
  resolved: "Решено",
};

const STATUS_TONE: Record<string, "info" | "primary" | "warning" | "success"> = {
  new: "info",
  open: "primary",
  pending: "warning",
  resolved: "success",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  urgent: "Срочный",
};

const PRIORITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [view, setView] = useState("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [triage, setTriage] = useState<Triage | null>(null);
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [tone, setTone] = useState("friendly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.tickets(), api.stats()]);
    setTickets(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  function openTicket(ticket: Ticket): void {
    setSelected(ticket);
    setTriage(null);
    setSuggest(null);
  }

  async function runTriage(): Promise<void> {
    if (selected) {
      setTriage(await api.triage(selected.id));
      await refresh();
    }
  }

  async function runSuggest(): Promise<void> {
    if (selected) {
      setSuggest(await api.suggest(selected.id, tone));
    }
  }

  async function changeStatus(status: string): Promise<void> {
    if (selected) {
      setSelected(await api.setStatus(selected.id, status));
      await refresh();
    }
  }

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="Helpdesk"
      subtitle="Обращения клиентов"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {view === "tickets" ? (
        <>
          <PageHead
            title="Очередь обращений"
            description="Фильтрация, приоритеты и AI-триаж по каждому тикету"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{tickets.length} в очереди</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="В работе" value={countBy(tickets, "open")} hint="статус «в работе»" />
            <Stat label="Срочных" value={countBy(tickets, "urgent")} hint="приоритет urgent" />
            <Stat label="С AI-меткой" value={stats?.ai_labeled ?? 0} hint="размечено моделью" />
          </div>
          <Card>
            <CardHead title="Тикеты" actions={<span className="sd-subtle">нажмите на строку</span>} />
            {tickets.length ? (
              <Table head={["Тема", "Клиент", "Канал", "Статус", "Приоритет", "AI-метка"]}>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => openTicket(ticket)} style={{ cursor: "pointer" }}>
                    <td className="sd-strong">{ticket.subject}</td>
                    <td>{ticket.client}</td>
                    <td className="sd-muted">{channelLabel(ticket.channel)}</td>
                    <td><Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge></td>
                    <td><Badge tone={PRIORITY_TONE[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Badge></td>
                    <td className="sd-muted">{ticket.ai_label ?? "—"}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                art={<HelpdeskArt />}
                title="Обращений нет"
                description="Запустите php projects/01-helpdesk/api/seed.php"
              />
            )}
          </Card>
          <Tip
            art={<HelpdeskArt />}
            title="Что делает AI-триаж"
            text="Модель читает тему и текст обращения, ставит метку темы и приоритет. Срочные поднимаются вверх очереди, уверенность видна в карточке обращения."
          />
          {selected ? (
            <TicketDetail
              ticket={selected}
              triage={triage}
              suggest={suggest}
              tone={tone}
              onTone={setTone}
              onTriage={runTriage}
              onSuggest={runSuggest}
              onStatus={changeStatus}
            />
          ) : null}
        </>
      ) : (
        <StatsView stats={stats} tickets={tickets} />
      )}
    </AppShell>
  );
}

function countBy(tickets: Ticket[], value: string): number {
  return tickets.filter((ticket) => ticket.status === value || ticket.priority === value).length;
}

function TicketDetail(props: {
  ticket: Ticket;
  triage: Triage | null;
  suggest: Suggest | null;
  tone: string;
  onTone: (tone: string) => void;
  onTriage: () => void;
  onSuggest: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <Card>
      <CardHead
        title={props.ticket.subject}
        actions={
          <Select value={props.ticket.status} onChange={(event) => props.onStatus(event.target.value)}>
            {Object.entries(STATUS_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </Select>
        }
      />
      <CardBody className="sd-stack">
        <div className="sd-row sd-muted">
          <span>{props.ticket.client}</span>
          <span>•</span>
                  <span>{channelLabel(props.ticket.channel)}</span>
          <span>•</span>
          <span>{props.ticket.created_at}</span>
        </div>
        <p style={{ margin: 0 }}>{props.ticket.body}</p>

        <AiPanel
          title="AI-триаж"
          action={<Button size="sm" variant="primary" onClick={props.onTriage}>Определить тему</Button>}
        >
          {props.triage ? (
            <div className="sd-stack">
              <div className="sd-row sd-row--between">
                <span>Тема: <strong>{props.triage.label}</strong></span>
                <Badge tone="primary">{percent(props.triage.confidence)} уверенность</Badge>
              </div>
              <Score value={props.triage.confidence * 100} />
              <span className="sd-subtle">провайдер: {props.triage.provider}, приоритет: {PRIORITY_LABEL[props.triage.priority]}</span>
            </div>
          ) : (
            <span className="sd-muted">Модель определит категорию и приоритет обращения.</span>
          )}
        </AiPanel>

        <AiPanel
          title="AI-черновик ответа"
          action={<Button size="sm" variant="accent" onClick={props.onSuggest}>Сгенерировать</Button>}
        >
          <Field label="Тон ответа">
            <Select value={props.tone} onChange={(event) => props.onTone(event.target.value)}>
              <option value="friendly">Дружелюбный</option>
              <option value="formal">Официальный</option>
              <option value="short">Короткий</option>
            </Select>
          </Field>
          {props.suggest ? (
            <Textarea readOnly value={props.suggest.draft} rows={5} />
          ) : (
            <span className="sd-muted">Черновик появится здесь.</span>
          )}
        </AiPanel>
      </CardBody>
    </Card>
  );
}

function StatsView({ stats, tickets }: { stats: Stats | null; tickets: Ticket[] }) {
  return (
    <>
      <PageHead title="Аналитика очереди" description="Распределение по статусам, приоритетам и AI-разметке" />
      <div className="sd-grid">
        <Stat label="Всего обращений" value={stats?.total ?? 0} />
        <Stat label="Размечено AI" value={stats?.ai_labeled ?? 0} hint="доля от всех" />
        <Stat label="Срочных" value={countBy(tickets, "urgent")} />
        <Stat label="Решено" value={countBy(tickets, "resolved")} />
      </div>
      <div className="sd-grid">
        <Card>
          <CardHead title="По статусам" />
          <CardBody className="sd-stack">
            {(stats?.by_status ?? []).map((row) => (
              <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                <div className="sd-row sd-row--between">
                  <Badge tone={STATUS_TONE[row.label]}>{STATUS_LABEL[row.label] ?? row.label}</Badge>
                  <span className="sd-num">{row.total}</span>
                </div>
                <Score value={share(row.total, stats?.total ?? 0)} />
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHead title="По приоритетам" />
          <CardBody className="sd-stack">
            {(stats?.by_priority ?? []).map((row) => (
              <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                <div className="sd-row sd-row--between">
                  <Badge tone={PRIORITY_TONE[row.label]}>{PRIORITY_LABEL[row.label] ?? row.label}</Badge>
                  <span className="sd-num">{row.total}</span>
                </div>
                <Score value={share(row.total, stats?.total ?? 0)} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function share(part: string, total: number): number {
  return total > 0 ? (Number(part) / total) * 100 : 0;
}
