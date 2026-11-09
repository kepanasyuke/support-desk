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
  Input,
  PageHead,
  Score,
  Spinner,
  Stat,
  Table,
} from "@sd/ui";
import { api, type Article, type KbStats, type SearchResult } from "./api";

const NAV = [
  { id: "articles", label: "Статьи" },
  { id: "search", label: "AI-поиск" },
  { id: "stats", label: "Аналитика" },
];

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [view, setView] = useState("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<KbStats | null>(null);
  const [query, setQuery] = useState("не приходит письмо с кодом подтверждения");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    const [list, summary] = await Promise.all([api.articles(), api.stats()]);
    setArticles(list);
    setStats(summary);
    setBusy(false);
  }, []);

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
  }, [refresh]);

  async function runSearch(): Promise<void> {
    setResult(await api.search(query));
  }

  async function findSimilar(article: Article): Promise<void> {
    setSelected(article);
    setResult(await api.similar(article.id));
    setView("search");
  }

  return (
    <AppShell
      brand="Knowledge"
      subtitle="База знаний поддержки"
      nav={NAV}
      current={view}
      onNavigate={setView}
      topbarRight={<Button variant="secondary" size="sm" onClick={() => refresh()}>Обновить</Button>}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {view === "articles" ? (
        <>
          <PageHead
            title="Статьи поддержки"
            description="Готовые ответы, из которых оператор собирает reply"
            actions={busy ? <Spinner /> : <Badge tone="neutral">{articles.length} статей</Badge>}
          />
          <Card>
            <CardHead title="Каталог" />
            {articles.length ? (
              <Table head={["Заголовок", "Категория", "Теги", "Просмотры", ""]}>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td className="sd-strong">{article.title}</td>
                    <td><Badge tone="primary">{article.category}</Badge></td>
                    <td className="sd-muted">{article.tags}</td>
                    <td className="sd-num">{article.views}</td>
                    <td>
                      <Button size="sm" variant="secondary" onClick={() => findSimilar(article)}>
                        Похожие
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty title="Статей нет" description="Запустите php projects/04-knowledge/api/seed.php" />
            )}
          </Card>
        </>
      ) : null}

      {view === "search" ? (
        <>
          <PageHead title="AI-поиск по базе" description="Определение темы запроса и подбор статей по релевантности" />
          <Card>
            <CardBody className="sd-stack">
              <div className="sd-row">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Опишите проблему клиента" />
                <Button variant="primary" onClick={runSearch}>Найти</Button>
              </div>
              {selected ? <span className="sd-subtle">похожие на «{selected.title}»</span> : null}
            </CardBody>
          </Card>
          {result ? (
            <AiPanel title="Результат AI-поиска" action={<Badge tone="primary">{result.provider}</Badge>}>
              <div className="sd-stack">
                <div className="sd-row sd-row--between">
                  <span>Тема запроса: <strong>{result.suggested_category}</strong></span>
                  <span className="sd-num">{percent(result.category_confidence)}</span>
                </div>
                <Score value={result.category_confidence * 100} />
                {result.articles.length ? (
                  <Table head={["Статья", "Категория", "Релевантность"]}>
                    {result.articles.map((hit) => (
                      <tr key={hit.id}>
                        <td className="sd-strong">{hit.title}</td>
                        <td className="sd-muted">{hit.category}</td>
                        <td style={{ minWidth: 120 }}><Score value={hit.score * 100} /></td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <Empty title="Ничего не найдено" description="Переформулируйте запрос" />
                )}
              </div>
            </AiPanel>
          ) : null}
        </>
      ) : null}

      {view === "stats" ? (
        <>
          <PageHead title="Аналитика базы знаний" description="Категории, просмотры и самые востребованные статьи" />
          <div className="sd-grid">
            <Stat label="Всего статей" value={stats?.total ?? 0} />
            {(stats?.by_category ?? []).slice(0, 3).map((row) => (
              <Stat key={row.label} label={row.label} value={row.total} hint={`${row.views ?? 0} просмотров`} />
            ))}
          </div>
          <Card>
            <CardHead title="Популярные статьи" />
            <CardBody className="sd-stack">
              {(stats?.popular ?? []).map((row) => (
                <div key={row.id} className="sd-row sd-row--between">
                  <span>{row.title}</span>
                  <span className="sd-num">{row.views}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}
