<?php

declare(strict_types=1);

namespace app\suggest\services;

use app\suggest\models\Draft;

final class DraftStatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped('tone'), $this->accepted(), $this->total());
    }

    private function grouped(string $column): array
    {
        return Draft::find()
            ->select(['label' => $column, 'total' => 'COUNT(*)'])
            ->groupBy($column)
            ->asArray()
            ->all();
    }

    private function accepted(): int
    {
        return (int) Draft::find()->where(['accepted' => 1])->count();
    }

    private function total(): int
    {
        return (int) Draft::find()->count();
    }

    private function build(array $tones, int $accepted, int $total): array
    {
        return [
            'total' => $total,
            'accepted' => $accepted,
            'acceptance_rate' => $total > 0 ? round($accepted / $total, 3) : 0.0,
            'by_tone' => $tones,
        ];
    }
}
