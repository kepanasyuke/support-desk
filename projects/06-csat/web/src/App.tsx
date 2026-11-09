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
  Spinner,
  Stat,
  Table,
  Tip,
  CsatArt,
} from "@sd/ui";
import { api, type CsatStats, type Sentiment, type Survey } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "dashboard", label: "Дашборд" },
  { id: "reviews", label: "Отзывы" },
  { id: "operators", label: "Операторы" },
];

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function scoreTone(score: number): "success" | "warning" | "danger" {
  return score >= 4 ? "success" : score === 3 ? "warning" : "danger";
}

export function App() {
  const [view, setView] = useState("dashboard");
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<CsatStats | null>(null);
  const [selected, setSelected] = useState<Survey | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.surveys(), api.stats()]);
    setSurveys(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  async function analyse(survey: Survey): Promise<void> {
    setSelected(survey);
    setSentiment(await api.analyse(survey.id));
    await refresh();
  }

  async function analyseAll(): Promise<void> {
    await api.analyseAll();
    await refresh();
  }

  const csat = stats && stats.total > 0 ? (stats.promoters / stats.total) * 100 : 0;

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="CSAT"
      subtitle="Удовлетворённость клиентов"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {view === "dashboard" ? (
        <>
          <PageHead
            title="Удовлетворённость клиентов"
            description="CSAT по оценкам 1–5 и AI-разбор комментариев"
            actions={
              <div className="sd-row">
                {busy ? <Spinner /> : null}
                <Button variant="primary" size="sm" onClick={analyseAll}>Разметить всё AI</Button>
              </div>
            }
          />
          <div className="sd-grid">
            <Stat label="CSAT" value={`${Math.round(csat)}%`} hint="оценки 4–5" />
            <Stat label="Средняя оценка" value={(stats?.average ?? 0).toFixed(2)} hint="из 5" />
            <Stat label="Промоутеры" value={stats?.promoters ?? 0} />
            <Stat label="Детракторы" value={stats?.detractors ?? 0} />
          </div>
          <div className="sd-grid">
            <Card>
              <CardHead title="Распределение оценок" />
              <CardBody className="sd-stack">
                {(stats?.distribution ?? []).map((row) => (
                  <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                    <div className="sd-row sd-row--between">
                      <Badge tone={scoreTone(Number(row.label))}>{row.label} из 5</Badge>
                      <span className="sd-num">{row.total}</span>
                    </div>
                    <Score value={share(row.total, stats?.total ?? 0)} />
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHead title="По каналам" />
              <CardBody className="sd-stack">
                {(stats?.by_channel ?? []).map((row) => (
                  <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                    <div className="sd-row sd-row--between">
                      <Badge tone="info">{row.label}</Badge>
                      <span className="sd-num">{row.avg_score}</span>
                    </div>
                    <Progress value={(Number(row.avg_score) / 5) * 100} />
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}

      {view === "reviews" ? (
        <>
          <PageHead title="Отзывы клиентов" description="Нажмите на отзыв, чтобы разобрать тональность моделью" />
          <Card>
            <CardHead title="Лента отзывов" />
            {surveys.length ? (
              <Table head={["Клиент", "Оценка", "Комментарий", "Канал", "Тональность"]}>
                {surveys.map((survey) => (
                  <tr key={survey.id} onClick={() => analyse(survey)} style={{ cursor: "pointer" }}>
                    <td className="sd-strong">{survey.client}</td>
                    <td><Badge tone={scoreTone(survey.score)}>{survey.score}</Badge></td>
                    <td className="sd-muted">{survey.comment}</td>
                    <td className="sd-muted">{survey.channel}</td>
                    <td className="sd-muted">{survey.ai_sentiment ?? "—"}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                art={<CsatArt />}
                title="Отзывов нет"
                description="Запустите php projects/06-csat/api/seed.php"
              />
            )}
          </Card>
          <Tip
            art={<CsatArt />}
            title="Откуда берутся метки"
            text="Оценка 1–5 задаёт базу, комментарий уточняет: смешанный отзыв уходит в нейтральные, резкий — в недовольные. Дальше система подсказывает, просить публичный отзыв или звонить клиенту."
          />
          {selected ? (
            <AiPanel title={`Разбор отзыва: ${selected.client}`} action={<Badge tone="primary">{selected.score} / 5</Badge>}>
              {sentiment ? (
                <div className="sd-stack">
                  <p style={{ margin: 0 }}>{selected.comment}</p>
                  <div className="sd-row sd-row--between">
                    <span>Тональность: <strong>{sentiment.sentiment}</strong></span>
                    <span className="sd-num">{percent(sentiment.confidence)}</span>
                  </div>
                  <Score value={sentiment.confidence * 100} />
                  <span className="sd-muted">Рекомендация: {sentiment.verdict}</span>
                  <span className="sd-subtle">провайдер: {sentiment.provider}</span>
                </div>
              ) : (
                <span className="sd-muted">Модель определит тональность и что делать дальше.</span>
              )}
            </AiPanel>
          ) : null}
        </>
      ) : null}

      {view === "operators" ? (
        <>
          <PageHead title="Оценки операторов" description="Средний балл и объём отзывов по каждому оператору" />
          <Card>
            <CardHead title="Операторы" />
            <CardBody className="sd-stack">
              {(stats?.by_operator ?? []).map((row) => (
                <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                  <div className="sd-row sd-row--between">
                    <span className="sd-strong">{row.label || "без оператора"}</span>
                    <span className="sd-num">{row.avg_score} · {row.total} отзывов</span>
                  </div>
                  <Progress value={(Number(row.avg_score) / 5) * 100} />
                </div>
              ))}
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
