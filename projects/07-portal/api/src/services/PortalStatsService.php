<?php

declare(strict_types=1);

namespace app\portal\services;

use app\portal\models\ClientRequest;

final class PortalStatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped('status'), $this->grouped('ai_category'));
    }

    private function grouped(string $column): array
    {
        return ClientRequest::find()
            ->select(['label' => $column, 'total' => 'COUNT(*)'])
            ->groupBy($column)
            ->asArray()
            ->all();
    }

    private function build(array $statuses, array $categories): array
    {
        return [
            'total' => (int) ClientRequest::find()->count(),
            'open' => (int) ClientRequest::find()->where(['in', 'status', ['new', 'in_progress']])->count(),
            'by_status' => $statuses,
            'by_category' => $categories,
        ];
    }
}
