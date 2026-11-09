<?php

declare(strict_types=1);

namespace app\sla\services;

use app\sla\models\SlaItem;
use sd\platform\ai\AiFactory;

final class RiskService
{
    private const LABELS = [
        'низкий риск просрочки',
        'средний риск просрочки',
        'высокий риск просрочки',
    ];

    public function assess(SlaItem $item): array
    {
        return $this->apply($item, $this->classify($item));
    }

    private function classify(SlaItem $item): array
    {
        return AiFactory::make()->classify($this->context($item), self::LABELS);
    }

    private function context(SlaItem $item): string
    {
        return $item->subject . ' ' . $item->client . ' ' . $this->urgencyWord($item);
    }

    private function urgencyWord(SlaItem $item): string
    {
        return $item->getRemaining() <= 0 ? 'просрочено критично' : 'в работе срок';
    }

    private function apply(SlaItem $item, array $result): array
    {
        $this->persist($item, $result);

        return $this->payload($item, $result);
    }

    private function persist(SlaItem $item, array $result): void
    {
        $item->setAttributes(['ai_risk' => $result['label'], 'ai_confidence' => $result['confidence']]);
        $item->save(false);
    }

    private function payload(SlaItem $item, array $result): array
    {
        return [
            'sla_id' => (int) $item->id,
            'risk' => (string) $result['label'],
            'confidence' => (float) $result['confidence'],
            'remaining_min' => $item->getRemaining(),
            'recommendation' => $this->recommend($item),
            'provider' => (string) ($result['provider'] ?? 'unknown'),
        ];
    }

    private function recommend(SlaItem $item): string
    {
        return $this->recommendations()[$this->bucket($item)] ?? 'держать в очереди';
    }

    private function bucket(SlaItem $item): string
    {
        return $item->getRemaining() <= 0 ? 'overdue' : ($item->getRemaining() < 30 ? 'soon' : 'ok');
    }

    private function recommendations(): array
    {
        return [
            'overdue' => 'подключить старшего специалиста и уведомить клиента',
            'soon' => 'назначить приоритетным и снять с паузы',
            'ok' => 'держать в очереди',
        ];
    }
}
