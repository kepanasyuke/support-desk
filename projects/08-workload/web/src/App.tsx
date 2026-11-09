import { useCallback, useEffect, useState } from "react";
import {
  AiPanel,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHead,
  Empty,
  PageHead,
  Progress,
  Score,
  Spinner,
  Stat,
  Table,
  Tip,
  WorkloadArt,
} from "@sd/ui";
import { api, type Advice, type Operator, type WorkloadStats } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "team", label: "Команда" },
  { id: "teams", label: "По группам" },
];

function utilisation(operator: Operator): number {
  return operator.capacity > 0 ? Math.round((operator.open_tickets / operator.capacity) * 100) : 0;
}

function tone(value: number): string {
  return value >= 90 ? "var(--sd-danger)" : value >= 70 ? "var(--sd-warning)" : "var(--sd-success)";
}

function bandLabel(value: number): string {
  return value >= 90 ? "Перегрузка" : value >= 70 ? "Повышенная" : "Норма";
}

function bandTone(value: number): "danger" | "warning" | "success" {
  return value >= 90 ? "danger" : value >= 70 ? "warning" : "success";
}

export function App() {
  const [view, setView] = useState("team");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [stats, setStats] = useState<WorkloadStats | null>(null);
  const [selected, setSelected] = useState<Operator | null>(null);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.operators(), api.stats()]);
    setOperators(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  async function advise(operator: Operator): Promise<void> {
    setSelected(operator);
    setAdvice(await api.advise(operator.id));
    await refresh();
  }

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="Workload"
      subtitle="Нагрузка команды"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {view === "team" ? (
        <>
          <PageHead
            title="Нагрузка операторов"
            description="Открытые обращения к ёмкости смены и совет модели по перераспределению"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{operators.length} операторов</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Средняя загрузка" value={`${stats?.average_utilisation ?? 0}%`} />
            <Stat label="Перегружены" value={stats?.overloaded ?? 0} hint="загрузка ≥ 90%" />
            <Stat label="Открытых тикетов" value={stats?.open_total ?? 0} />
            <Stat label="Закрыто сегодня" value={stats?.resolved_total ?? 0} />
          </div>
          <Card>
            <CardHead title="Команда" actions={<span className="sd-subtle">нажмите для AI-совета</span>} />
            {operators.length ? (
              <Table head={["Оператор", "Группа", "Открыто", "Закрыто", "Ответ", "Загрузка"]}>
                {operators.map((operator) => (
                  <tr key={operator.id} onClick={() => advise(operator)} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="sd-row">
                        <Avatar name={operator.name} />
                        <span className="sd-strong">{operator.name}</span>
                      </div>
                    </td>
                    <td className="sd-muted">{operator.team}</td>
                    <td className="sd-num">{operator.open_tickets} / {operator.capacity}</td>
                    <td className="sd-num">{operator.resolved_today}</td>
                    <td className="sd-num">{operator.avg_response_min} мин</td>
                    <td style={{ minWidth: 150 }}>
                      <div className="sd-row">
                        <Progress value={utilisation(operator)} tone={tone(utilisation(operator))} />
                        <span className="sd-num">{utilisation(operator)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                art={<WorkloadArt />}
                title="Операторов нет"
                description="Запустите php projects/08-workload/api/seed.php"
              />
            )}
          </Card>
          <Tip
            art={<WorkloadArt />}
            title="Как считается загрузка"
            text="Открытые обращения относятся к ёмкости смены: до 60% — свободно, 90% и выше — перегруз. Совет предлагает, у кого снять часть очереди и кому добавить."
          />
          {selected ? (
            <AiPanel
              title={`AI-совет: ${selected.name}`}
              action={<Badge tone={bandTone(utilisation(selected))}>{bandLabel(utilisation(selected))}</Badge>}
            >
              {advice ? (
                <div className="sd-stack">
                  <div className="sd-row sd-row--between">
                    <span>Загрузка: <strong>{advice.utilisation}%</strong></span>
                    <span className="sd-muted">{advice.band}</span>
                  </div>
                  <Score value={advice.utilisation} />
                  <p style={{ margin: 0 }}>{advice.advice}</p>
                  <span className="sd-subtle">провайдер: {advice.provider}</span>
                </div>
              ) : (
                <span className="sd-muted">Модель предложит, как перераспределить очередь.</span>
              )}
            </AiPanel>
          ) : null}
        </>
      ) : null}

      {view === "teams" ? (
        <>
          <PageHead title="Нагрузка по группам" description="Суммарные показатели по каждой команде" />
          <Card>
            <CardHead title="Группы" />
            <CardBody className="sd-stack">
              {(stats?.by_team ?? []).length ? (
                (stats?.by_team ?? []).map((row) => (
                  <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                    <div className="sd-row sd-row--between">
                      <span className="sd-strong">{row.label}</span>
                      <span className="sd-num">
                        открыто {row.open_tickets} · закрыто {row.resolved_today} · человек {row.total}
                      </span>
                    </div>
                    <Progress value={share(row.open_tickets, stats?.open_total ?? 0)} />
                  </div>
                ))
              ) : (
                <Empty
                art={<WorkloadArt />}
                title="Данных нет"
                description="Запустите php projects/08-workload/api/seed.php"
              />
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}

function share(part: string, total: number): number {
  return total > 0 ? (Number(part) / total) * 100 : 0;
}
