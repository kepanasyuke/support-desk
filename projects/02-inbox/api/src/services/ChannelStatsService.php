<?php

declare(strict_types=1);

namespace app\inbox\services;

use app\inbox\models\Message;

final class ChannelStatsService
{
    public function summary(): array
    {
        return $this->build($this->grouped('channel'), $this->grouped('status'), $this->grouped('ai_intent'));
    }

    private function grouped(string $column): array
    {
        return Message::find()
            ->select(['label' => $column, 'total' => 'COUNT(*)'])
            ->groupBy($column)
            ->asArray()
            ->all();
    }

    private function build(array $channels, array $statuses, array $intents): array
    {
        return [
            'total' => (int) Message::find()->count(),
            'by_channel' => $channels,
            'by_status' => $statuses,
            'by_intent' => $intents,
            'unrouted' => (int) Message::find()->where(['ai_intent' => null])->count(),
        ];
    }
}
