<?php

declare(strict_types=1);

namespace app\csat\services;

use app\csat\models\Survey;

final class CsatStatsService
{
    public function summary(): array
    {
        return $this->build($this->distribution(), $this->byChannel(), $this->byOperator());
    }

    private function distribution(): array
    {
        return Survey::find()
            ->select(['label' => 'score', 'total' => 'COUNT(*)'])
            ->groupBy('score')
            ->orderBy(['score' => SORT_ASC])
            ->asArray()
            ->all();
    }

    private function byChannel(): array
    {
        return Survey::find()
            ->select(['label' => 'channel', 'total' => 'COUNT(*)', 'avg_score' => 'ROUND(AVG(score), 2)'])
            ->groupBy('channel')
            ->asArray()
            ->all();
    }

    private function byOperator(): array
    {
        return Survey::find()
            ->select(['label' => 'operator', 'total' => 'COUNT(*)', 'avg_score' => 'ROUND(AVG(score), 2)'])
            ->groupBy('operator')
            ->asArray()
            ->all();
    }

    private function build(array $distribution, array $channels, array $operators): array
    {
        return [
            'total' => (int) Survey::find()->count(),
            'average' => (float) (Survey::find()->average('score') ?? 0),
            'promoters' => (int) Survey::find()->where(['>=', 'score', 4])->count(),
            'detractors' => (int) Survey::find()->where(['<=', 'score', 2])->count(),
            'distribution' => $distribution,
            'by_channel' => $channels,
            'by_operator' => $operators,
        ];
    }
}
