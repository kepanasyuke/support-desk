<?php

declare(strict_types=1);

namespace app\csat\services;

use app\csat\models\Survey;
use sd\platform\ai\AiFactory;

final class SentimentService
{
    private const LABELS = [
        'клиент недоволен',
        'нейтральный отзыв',
        'клиент доволен',
    ];

    public function analyse(Survey $survey): array
    {
        return $this->apply($survey, $this->classify($survey));
    }

    private function classify(Survey $survey): array
    {
        return AiFactory::make()->classify($this->text($survey), self::LABELS);
    }

    private function text(Survey $survey): string
    {
        return trim($survey->comment . ' оценка ' . $survey->score . ' ' . $survey->channel);
    }

    private function apply(Survey $survey, array $result): array
    {
        $this->persist($survey, $result);

        return $this->payload($survey, $result);
    }

    private function persist(Survey $survey, array $result): void
    {
        $survey->setAttributes(['ai_sentiment' => $result['label'], 'ai_confidence' => $result['confidence']]);
        $survey->save(false);
    }

    private function payload(Survey $survey, array $result): array
    {
        return [
            'survey_id' => (int) $survey->id,
            'sentiment' => (string) $result['label'],
            'confidence' => (float) $result['confidence'],
            'score' => (int) $survey->score,
            'verdict' => $this->verdict($survey),
            'provider' => (string) ($result['provider'] ?? 'unknown'),
        ];
    }

    private function verdict(Survey $survey): string
    {
        return $this->verdicts()[$this->bucket($survey)] ?? 'нейтрально';
    }

    private function bucket(Survey $survey): string
    {
        return $survey->score >= 4 ? 'good' : ($survey->score === 3 ? 'middle' : 'bad');
    }

    private function verdicts(): array
    {
        return [
            'good' => 'можно просить публичный отзыв',
            'middle' => 'уточнить детали у клиента',
            'bad' => 'передать руководителю и связаться с клиентом',
        ];
    }
}
