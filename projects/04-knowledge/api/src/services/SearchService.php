<?php

declare(strict_types=1);

namespace app\kb\services;

use app\kb\models\Article;
use sd\platform\ai\AiFactory;

final class SearchService
{
    private const CATEGORIES = [
        'оплата и billing',
        'технические ошибки',
        'доставка и логистика',
        'доступ и безопасность',
        'интеграции и API',
    ];

    public function search(string $query): array
    {
        return $this->respond($query, $this->categoryOf($query), $this->matches($query));
    }

    private function categoryOf(string $query): array
    {
        return AiFactory::make()->classify($query, self::CATEGORIES);
    }

    private function matches(string $query): array
    {
        return $this->ranked(Article::find()->all(), $query);
    }

    private function ranked(array $articles, string $query): array
    {
        return $this->top(array_map(fn (Article $article): array => $this->score($article, $query), $articles));
    }

    private function score(Article $article, string $query): array
    {
        return [
            'id' => (int) $article->id,
            'title' => $article->title,
            'category' => $article->category,
            'score' => $this->overlap($article, $query),
        ];
    }

    private function overlap(Article $article, string $query): float
    {
        return $this->ratio($this->tokens($query), $this->tokens($this->text($article)));
    }

    private function text(Article $article): string
    {
        return $article->title . ' ' . $article->tags . ' ' . $article->body;
    }

    private function ratio(array $wanted, array $haystack): float
    {
        return round(count(array_intersect($wanted, $haystack)) / max(count($wanted), 1), 3);
    }

    private function tokens(string $text): array
    {
        return $this->meaningful(preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text)) ?: []);
    }

    private function meaningful(array $words): array
    {
        return array_values(array_filter($words, fn (string $word): bool => mb_strlen($word) > 3));
    }

    private function top(array $scored): array
    {
        usort($scored, fn (array $left, array $right): int => $right['score'] <=> $left['score']);

        return array_slice($scored, 0, 5);
    }

    private function respond(string $query, array $category, array $articles): array
    {
        return [
            'query' => $query,
            'suggested_category' => (string) $category['label'],
            'category_confidence' => (float) $category['confidence'],
            'articles' => $articles,
            'provider' => (string) ($category['provider'] ?? 'unknown'),
        ];
    }
}
