<?php

declare(strict_types=1);

namespace app\portal\services;

use app\portal\models\ClientRequest;
use sd\platform\ai\AiFactory;

final class RoutingService
{
    private const CATEGORIES = [
        'оплата и документы',
        'техническая неисправность',
        'доставка заказа',
        'доступ к аккаунту',
        'консультация',
    ];

    public function route(ClientRequest $request): array
    {
        return $this->apply($request, $this->classify($request));
    }

    private function classify(ClientRequest $request): array
    {
        return AiFactory::make()->classify($request->subject . ' ' . $request->body, self::CATEGORIES);
    }

    private function apply(ClientRequest $request, array $result): array
    {
        $this->persist($request, $result);

        return $this->payload($request, $result);
    }

    private function persist(ClientRequest $request, array $result): void
    {
        $request->setAttributes(['ai_category' => $result['label'], 'ai_confidence' => $result['confidence']]);
        $request->save(false);
    }

    private function payload(ClientRequest $request, array $result): array
    {
        $category = (string) $result['label'];

        return [
            'request_id' => (int) $request->id,
            'category' => $category,
            'confidence' => (float) $result['confidence'],
            'queue' => $this->queueFor($category),
            'eta_hours' => $this->etaFor($category),
            'provider' => (string) ($result['provider'] ?? 'unknown'),
        ];
    }

    private function queueFor(string $category): string
    {
        return $this->queues()[$category] ?? 'первая линия';
    }

    private function etaFor(string $category): int
    {
        return $this->etas()[$category] ?? 8;
    }

    private function queues(): array
    {
        return [
            'оплата и документы' => 'финансовая группа',
            'техническая неисправность' => 'вторая линия',
            'доставка заказа' => 'логистика',
            'доступ к аккаунту' => 'безопасность',
            'консультация' => 'первая линия',
        ];
    }

    private function etas(): array
    {
        return [
            'оплата и документы' => 4,
            'техническая неисправность' => 2,
            'доставка заказа' => 6,
            'доступ к аккаунту' => 1,
            'консультация' => 12,
        ];
    }
}
