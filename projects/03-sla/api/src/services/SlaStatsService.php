<?php

declare(strict_types=1);

namespace app\sla\services;

use app\sla\models\SlaItem;

final class SlaStatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped('status'), $this->grouped('priority'), $this->overdue(), $this->running());
    }

    private function grouped(string $column): array
    {
        return SlaItem::find()
            ->select(['label' => $column, 'total' => 'COUNT(*)'])
            ->groupBy($column)
            ->asArray()
            ->all();
    }

    private function overdue(): int
    {
        return (int) SlaItem::find()->where('elapsed_min >= limit_min')->count();
    }

    private function running(): array
    {
        return SlaItem::find()
            ->select(['id', 'subject', 'limit_min', 'elapsed_min'])
            ->where(['status' => 'running'])
            ->asArray()
            ->all();
    }

    private function build(array $statuses, array $priorities, int $overdue, array $running): array
    {
        return [
            'total' => (int) SlaItem::find()->count(),
            'by_status' => $statuses,
            'by_priority' => $priorities,
            'overdue' => $overdue,
            'running' => $running,
        ];
    }
}
