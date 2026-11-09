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
  Input,
  PageHead,
  Score,
  Spinner,
  Stat,
  Table,
  Textarea,
} from "@sd/ui";
import { api, type ClientRequest, type PortalStats, type Routing } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "requests", label: "Мои заявки" },
  { id: "new", label: "Новая заявка" },
  { id: "stats", label: "Сводка" },
];

const STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  answered: "Отвечено",
  closed: "Закрыта",
};

const STATUS_TONE: Record<string, "info" | "primary" | "warning" | "neutral"> = {
  new: "info",
  in_progress: "primary",
  answered: "warning",
  closed: "neutral",
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [view, setView] = useState("requests");
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [selected, setSelected] = useState<ClientRequest | null>(null);
  const [routing, setRouting] = useState<Routing | null>(null);
  const [form, setForm] = useState({
    client: "ООО «Вектор»",
    email: "buh@vektor.ru",
    subject: "Не приходит закрывающий документ",
    body: "Оплатили подписку, акт не получили. Прошу выслать повторно.",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.requests(), api.stats()]);
    setRequests(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  async function route(request: ClientRequest): Promise<void> {
    setSelected(request);
    setRouting(await api.route(request.id));
    await refresh();
  }

  async function submit(): Promise<void> {
    const created = await api.create(form);
    await api.route(created.id);
    setView("requests");
    await refresh();
  }

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="Portal"
      subtitle="Кабинет клиента"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {view === "requests" ? (
        <>
          <PageHead
            title="Заявки клиента"
            description="История обращений и автоматическая маршрутизация"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{requests.length} заявок</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Открытых" value={stats?.open ?? 0} />
            <Stat label="Закрытых" value={countStatus(requests, "closed")} />
            <Stat label="Категорий" value={(stats?.by_category ?? []).filter((row) => row.label).length} />
          </div>
          <Card>
            <CardHead title="Список заявок" actions={<span className="sd-subtle">нажмите для маршрутизации</span>} />
            {requests.length ? (
              <Table head={["Тема", "Клиент", "Статус", "Категория", "Создана"]}>
                {requests.map((request) => (
                  <tr key={request.id} onClick={() => route(request)} style={{ cursor: "pointer" }}>
                    <td className="sd-strong">{request.subject}</td>
                    <td className="sd-muted">{request.client}</td>
                    <td><Badge tone={STATUS_TONE[request.status]}>{STATUS_LABEL[request.status]}</Badge></td>
                    <td className="sd-muted">{request.ai_category ?? "—"}</td>
                    <td className="sd-subtle">{request.created_at}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty title="Заявок нет" description="Запустите php projects/07-portal/api/seed.php" />
            )}
          </Card>
          {selected ? (
            <AiPanel title={`Маршрутизация: ${selected.subject}`} action={<Badge tone="primary">{selected.status}</Badge>}>
              {routing ? (
                <div className="sd-stack">
                  <div className="sd-row sd-row--between">
                    <span>Категория: <strong>{routing.category}</strong></span>
                    <span className="sd-num">{percent(routing.confidence)}</span>
                  </div>
                  <Score value={routing.confidence * 100} />
                  <span className="sd-muted">Очередь: {routing.queue} · ответ в течение {routing.eta_hours} ч</span>
                  <span className="sd-subtle">провайдер: {routing.provider}</span>
                </div>
              ) : (
                <span className="sd-muted">Модель определит категорию и очередь.</span>
              )}
            </AiPanel>
          ) : null}
        </>
      ) : null}

      {view === "new" ? (
        <>
          <PageHead title="Новая заявка" description="Заявка сразу уходит в нужную очередь по классификации AI" />
          <Card>
            <CardHead title="Форма обращения" />
            <CardBody className="sd-stack">
              <Field label="Компания">
                <Input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Тема">
                <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              </Field>
              <Field label="Описание">
                <Textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={4} />
              </Field>
              <div className="sd-row">
                <Button variant="primary" onClick={submit}>Отправить заявку</Button>
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}

      {view === "stats" ? (
        <>
          <PageHead title="Сводка по заявкам" description="Статусы и категории обращений" />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Открытых" value={stats?.open ?? 0} />
            <Stat label="Новых" value={countStatus(requests, "new")} />
            <Stat label="В работе" value={countStatus(requests, "in_progress")} />
          </div>
          <div className="sd-grid">
            <Card>
              <CardHead title="По статусам" />
              <CardBody className="sd-stack">
                {(stats?.by_status ?? []).map((row) => (
                  <div key={row.label} className="sd-row sd-row--between">
                    <Badge tone={STATUS_TONE[row.label] ?? "neutral"}>{STATUS_LABEL[row.label] ?? row.label}</Badge>
                    <span className="sd-num">{row.total}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHead title="По категориям" />
              <CardBody className="sd-stack">
                {(stats?.by_category ?? []).filter((row) => row.label).length ? (
                  (stats?.by_category ?? []).filter((row) => row.label).map((row) => (
                    <div key={row.label} className="sd-row sd-row--between">
                      <span className="sd-muted">{row.label}</span>
                      <span className="sd-num">{row.total}</span>
                    </div>
                  ))
                ) : (
                  <Empty title="Категорий пока нет" description="Отправьте заявку или нажмите на существующую" />
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}

function countStatus(requests: ClientRequest[], status: string): number {
  return requests.filter((request) => request.status === status).length;
}
