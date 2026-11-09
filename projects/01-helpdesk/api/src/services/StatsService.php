<?php

declare(strict_types=1);

namespace app\helpdesk\services;

use app\helpdesk\models\Ticket;

final class StatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped('status'), $this->grouped('priority'), $this->labeled());
    }

    private function grouped(string $column): array
    {
        return Ticket::find()
            ->select(['label' => $column, 'total' => 'COUNT(*)'])
            ->groupBy($column)
            ->asArray()
            ->all();
    }

    private function labeled(): int
    {
        return (int) Ticket::find()->where(['not', ['ai_label' => null]])->count();
    }

    private function build(array $statuses, array $priorities, int $labeled): array
    {
        return [
            'total' => (int) Ticket::find()->count(),
            'by_status' => $statuses,
            'by_priority' => $priorities,
            'ai_labeled' => $labeled,
        ];
    }
}
