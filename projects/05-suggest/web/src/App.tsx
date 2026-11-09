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
  Select,
  SkeletonTable,
  Spinner,
  Stat,
  Table,
  Textarea,
  Tip,
  SuggestArt,
} from "@sd/ui";
import { api, type Draft, type DraftStats, type Generated } from "./api";

const EMBEDDED = new URLSearchParams(window.location.search).get("embed") === "1";

const NAV = [
  { id: "compose", label: "Генератор" },
  { id: "drafts", label: "Черновики" },
  { id: "stats", label: "Эффективность" },
];

const TONE_LABEL: Record<string, string> = {
  friendly: "Дружелюбный",
  formal: "Официальный",
  short: "Короткий",
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [view, setView] = useState("compose");
  const [subject, setSubject] = useState("Не приходит счёт за октябрь");
  const [body, setBody] = useState("Оплатили подписку 3 октября, закрывающие документы не пришли.");
  const [tone, setTone] = useState("friendly");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<DraftStats | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.drafts(), api.stats()]);
    setDrafts(list);
    setStats(summary);
    setBusy(false);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  async function generate(): Promise<void> {
    setGenerated(await api.generate({ subject, body, tone }));
    await refresh();
  }

  async function regenerate(draft: Draft): Promise<void> {
    setGenerated(await api.regenerate(draft.id));
    await refresh();
  }

  async function accept(draft: Draft): Promise<void> {
    await api.accept(draft.id);
    await refresh();
  }

  return (
    <AppShell
      embedded={EMBEDDED}
      brand="Suggest"
      subtitle="Черновики ответов"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {view === "compose" ? (
        <>
          <PageHead
            title="Генератор ответа"
            description="Черновик по тексту обращения и выбранному тону"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{drafts.length} черновиков</Badge>}
          />
          <div className="sd-grid">
            <Stat label="Черновиков" value={stats?.total ?? 0} />
            <Stat label="Принято" value={stats?.accepted ?? 0} />
            <Stat label="Доля принятия" value={percent(stats?.acceptance_rate ?? 0)} />
          </div>
          <Card>
            <CardHead title="Входные данные" />
            <CardBody className="sd-stack">
              <Field label="Тема обращения">
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </Field>
              <Field label="Текст обращения">
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} />
              </Field>
              <Field label="Тон ответа">
                <Select value={tone} onChange={(event) => setTone(event.target.value)}>
                  <option value="friendly">Дружелюбный</option>
                  <option value="formal">Официальный</option>
                  <option value="short">Короткий</option>
                </Select>
              </Field>
              <div className="sd-row">
                <Button variant="primary" onClick={generate}>Сгенерировать черновик</Button>
              </div>
            </CardBody>
          </Card>
          {generated ? (
            <AiPanel title="Черновик ответа" action={<Badge tone="primary">{generated.provider}</Badge>}>
              <div className="sd-stack">
                <Textarea readOnly value={generated.draft} rows={5} />
                <span className="sd-subtle">модель: {generated.model}, тон: {TONE_LABEL[generated.tone] ?? generated.tone}</span>
              </div>
            </AiPanel>
          ) : null}
          <Tip
            art={<SuggestArt />}
            title="Что учитывает черновик"
            text="Тема обращения, имя клиента и выбранный тон: деловой, дружелюбный или короткий. Текст можно перегенерировать или принять и отредактировать вручную."
          />
        </>
      ) : null}

      {view === "drafts" ? (
        <>
          <PageHead title="История черновиков" description="Принятые и отклонённые варианты ответов" />
          <Card>
            <CardHead title="Черновики" />
            {drafts.length ? (
              <Table head={["Тема", "Тон", "Черновик", "Статус", ""]}>
                {drafts.map((draft) => (
                  <tr key={draft.id}>
                    <td className="sd-strong">{draft.ticket_subject}</td>
                    <td><Badge tone="info">{TONE_LABEL[draft.tone] ?? draft.tone}</Badge></td>
                    <td className="sd-muted">{short(draft.draft_text)}</td>
                    <td>
                      <Badge tone={draft.accepted ? "success" : "neutral"}>
                        {draft.accepted ? "Принят" : "Не принят"}
                      </Badge>
                    </td>
                    <td>
                      <div className="sd-row">
                        <Button size="sm" variant="secondary" onClick={() => regenerate(draft)}>Заново</Button>
                        <Button size="sm" variant="ghost" onClick={() => accept(draft)}>Принять</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : ready ? (
              <Empty
                art={<SuggestArt />}
                title="Черновиков нет"
                description="Запустите php projects/05-suggest/api/seed.php"
              />
            ) : (
              <SkeletonTable rows={6} cols={3} />
            )}
          </Card>
        </>
      ) : null}

      {view === "stats" ? (
        <>
          <PageHead title="Эффективность подсказок" description="Сколько черновиков операторы принимают без правок" />
          <div className="sd-grid">
            <Stat label="Всего" value={stats?.total ?? 0} />
            <Stat label="Принято" value={stats?.accepted ?? 0} />
            <Stat label="Доля принятия" value={percent(stats?.acceptance_rate ?? 0)} />
            <Stat label="Тонов" value={(stats?.by_tone ?? []).length} />
          </div>
          <Card>
            <CardHead title="По тону ответа" />
            <CardBody className="sd-stack">
              {(stats?.by_tone ?? []).map((row) => (
                <div key={row.label} className="sd-stack" style={{ gap: 6 }}>
                  <div className="sd-row sd-row--between">
                    <Badge tone="info">{TONE_LABEL[row.label] ?? row.label}</Badge>
                    <span className="sd-num">{row.total}</span>
                  </div>
                  <Score value={share(row.total, stats?.total ?? 0)} />
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}

function short(text: string): string {
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function share(part: string, total: number): number {
  return total > 0 ? (Number(part) / total) * 100 : 0;
}
