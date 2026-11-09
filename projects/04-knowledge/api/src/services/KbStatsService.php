<?php

declare(strict_types=1);

namespace app\kb\services;

use app\kb\models\Article;

final class KbStatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped(), $this->popular());
    }

    private function grouped(): array
    {
        return Article::find()
            ->select(['label' => 'category', 'total' => 'COUNT(*)', 'views' => 'SUM(views)'])
            ->groupBy('category')
            ->asArray()
            ->all();
    }

    private function popular(): array
    {
        return Article::find()
            ->select(['id', 'title', 'category', 'views'])
            ->orderBy(['views' => SORT_DESC])
            ->limit(5)
            ->asArray()
            ->all();
    }

    private function build(array $categories, array $popular): array
    {
        return [
            'total' => (int) Article::find()->count(),
            'by_category' => $categories,
            'popular' => $popular,
        ];
    }
}
