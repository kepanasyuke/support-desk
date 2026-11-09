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
  Progress,
  Score,
  Select,
  SkeletonTable,
  Spinner,
  Stat,
  Table,
  Tip,
  SlaArt,
} from "@sd/ui";
import { api, type Risk, type SlaItem, type SlaStats } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "queue", label: "Очередь SLA" },
  { id: "stats", label: "Сводка" },
];

const PRIORITY_LABEL: Record<string, string> = {
  standard: "Стандартный",
  high: "Высокий",
  critical: "Критический",
};

const PRIORITY_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  standard: "neutral",
  high: "warning",
  critical: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  running: "Идёт",
  paused: "Пауза",
  met: "В срок",
  breached: "Просрочено",
};

const STATUS_TONE: Record<string, "info" | "neutral" | "success" | "danger"> = {
  running: "info",
  paused: "neutral",
  met: "success",
  breached: "danger",
};

function minutes(value: number): string {
  return value >= 60 ? `${Math.floor(value / 60)} ч ${value % 60} мин` : `${value} мин`;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function used(item: SlaItem): number {
  return item.limit_min > 0 ? Math.min(100, (item.elapsed_min / item.limit_min) * 100) : 0;
}

function barTone(item: SlaItem): string {
  return item.elapsed_min >= item.limit_min ? "var(--sd-danger)" : used(item) > 80 ? "var(--sd-warning)" : "var(--sd-primary)";
}

export function App() {
  const [view, setView] = useState("queue");
  const [priority, setPriority] = useState("all");
  const [items, setItems] = useState<SlaItem[]>([]);
  const [stats, setStats] = useState<SlaStats | null>(null);
  const [selected, setSelected] = useState<SlaItem | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.items(), api.stats()]);
    setItems(list);
    setStats(summary);
    setBusy(false);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  function open(item: SlaItem): void {
    setSelected(item);
    setRisk(null);
  }

  async function assess(): Promise<void> {
    if (selected) {
      setRisk(await api.assess(selected.id));
      await refresh();
    }
  }

  async function pause(): Promise<void> {
    if (selected) {
      setSelected(await api.pause(selected.id));
      await refresh();
    }
  }

  const visible = priority === "all" ? items : items.filter((item) => item.priority === priority);

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="SLA"
      subtitle="Контроль сроков ответа"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {view === "queue" ? (
        <>
          <PageHead
            title="Очередь с контролем сроков"
            description="Оставшееся время, просрочки и оценка риска моделью"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{visible.length} записей</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Просрочено" value={stats?.overdue ?? 0} hint="elapsed ≥ limit" />
            <Stat label="В работе" value={countStatus(items, "running")} />
            <Stat label="Критических" value={items.filter((item) => item.priority === "critical").length} />
          </div>
          <Card>
            <CardHead
              title="Записи"
              actions={
                <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="all">Все приоритеты</option>
                  <option value="standard">Стандартный</option>
                  <option value="high">Высокий</option>
                  <option value="critical">Критический</option>
                </Select>
              }
            />
            {visible.length ? (
              <Table head={["Обращение", "Клиент", "Приоритет", "Осталось", "Использовано", "Статус"]}>
                {visible.map((item) => (
                  <tr key={item.id} onClick={() => open(item)} style={{ cursor: "pointer" }}>
                    <td className="sd-strong">{item.subject}</td>
                    <td className="sd-muted">{item.client}</td>
                    <td><Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge></td>
                    <td className="sd-num">{minutes(item.limit_min - item.elapsed_min)}</td>
                    <td style={{ minWidth: 120 }}>
                      <Progress value={used(item)} tone={barTone(item)} />
                    </td>
                    <td><Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge></td>
                  </tr>
                ))}
              </Table>
            ) : ready ? (
              <Empty
                art={<SlaArt />}
                title="Записей нет"
                description="Запустите php projects/03-sla/api/seed.php"
              />
            ) : (
              <SkeletonTable rows={6} cols={5} />
            )}
          </Card>
          <Tip
            art={<SlaArt />}
            title="Как считается риск"
            text="Модель смотрит на остаток времени до дедлайна, приоритет и историю ответов. Высокий риск подсвечивается красным, а полоса показывает, сколько лимита уже израсходовано."
          />
          {selected ? (
            <Card>
              <CardHead
                title={selected.subject}
                actions={<Button size="sm" variant="secondary" onClick={pause}>Поставить на паузу</Button>}
              />
              <CardBody className="sd-stack">
                <div className="sd-row sd-muted">
                  <span>{selected.client}</span>
                  <span>•</span>
                  <span>лимит {minutes(selected.limit_min)}</span>
                  <span>•</span>
                  <span>прошло {minutes(selected.elapsed_min)}</span>
                </div>
                <Progress value={used(selected)} tone={barTone(selected)} />
                <AiPanel
                  title="AI-прогноз просрочки"
                  action={<Button size="sm" variant="primary" onClick={assess}>Оценить риск</Button>}
                >
                  {risk ? (
                    <div className="sd-stack">
                      <div className="sd-row sd-row--between">
                        <span><strong>{risk.risk}</strong></span>
                        <Badge tone="primary">{percent(risk.confidence)}</Badge>
                      </div>
                      <Score value={risk.confidence * 100} />
                      <span className="sd-muted">Рекомендация: {risk.recommendation}</span>
                      <span className="sd-subtle">провайдер: {risk.provider}</span>
                    </div>
                  ) : (
                    <span className="sd-muted">Модель оценит вероятность нарушения срока.</span>
                  )}
                </AiPanel>
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <PageHead title="Сводка по срокам" description="Распределение по статусам и приоритетам" />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Просрочено" value={stats?.overdue ?? 0} />
            <Stat label="В срок" value={countStatus(items, "met")} />
            <Stat label="На паузе" value={countStatus(items, "paused")} />
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
              <CardHead title="По приоритетам" />
              <CardBody className="sd-stack">
                {(stats?.by_priority ?? []).map((row) => (
                  <div key={row.label} className="sd-row sd-row--between">
                    <Badge tone={PRIORITY_TONE[row.label] ?? "neutral"}>{PRIORITY_LABEL[row.label] ?? row.label}</Badge>
                    <span className="sd-num">{row.total}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function countStatus(items: SlaItem[], status: string): number {
  return items.filter((item) => item.status === status).length;
}
