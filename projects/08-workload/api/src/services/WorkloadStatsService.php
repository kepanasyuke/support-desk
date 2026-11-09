<?php

declare(strict_types=1);

namespace app\workload\services;

use app\workload\models\Operator;

final class WorkloadStatsService
{
    public function summary(): array
    {
        return $this->build($this->operators(), $this->byTeam());
    }

    private function operators(): array
    {
        return Operator::find()->all();
    }

    private function byTeam(): array
    {
        return Operator::find()
            ->select([
                'label' => 'team',
                'total' => 'COUNT(*)',
                'open_tickets' => 'SUM(open_tickets)',
                'resolved_today' => 'SUM(resolved_today)',
            ])
            ->groupBy('team')
            ->asArray()
            ->all();
    }

    private function build(array $operators, array $teams): array
    {
        return [
            'total' => count($operators),
            'open_total' => (int) Operator::find()->sum('open_tickets'),
            'resolved_total' => (int) Operator::find()->sum('resolved_today'),
            'average_utilisation' => $this->average($operators),
            'overloaded' => $this->overloaded($operators),
            'by_team' => $teams,
        ];
    }

    private function average(array $operators): int
    {
        $values = array_map(fn (Operator $operator): int => $operator->getUtilisation(), $operators);

        return $values ? (int) round(array_sum($values) / count($values)) : 0;
    }

    private function overloaded(array $operators): int
    {
        return count(array_filter($operators, fn (Operator $operator): bool => $operator->getUtilisation() >= 90));
    }
}
