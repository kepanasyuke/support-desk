<?php

declare(strict_types=1);

namespace app\inbox\services;

use app\inbox\models\Message;
use sd\platform\ai\AiFactory;

final class IntentService
{
    private const INTENTS = [
        'претензия и жалоба',
        'вопрос по заказу',
        'техническая проблема',
        'спам и реклама',
        'благодарность',
    ];

    public function classify(Message $message): array
    {
        return $this->apply($message, $this->run($message));
    }

    private function run(Message $message): array
    {
        return AiFactory::make()->classify($message->text, self::INTENTS);
    }

    private function apply(Message $message, array $result): array
    {
        $this->persist($message, $result);

        return $this->payload($message, $result);
    }

    private function persist(Message $message, array $result): void
    {
        $message->setAttributes(['ai_intent' => $result['label'], 'ai_confidence' => $result['confidence']]);
        $message->save(false);
    }

    private function payload(Message $message, array $result): array
    {
        return [
            'message_id' => (int) $message->id,
            'channel' => $message->channel,
            'intent' => (string) $result['label'],
            'confidence' => (float) $result['confidence'],
            'route_to' => $this->routeFor((string) $result['label']),
            'provider' => (string) ($result['provider'] ?? 'unknown'),
        ];
    }

    private function routeFor(string $intent): string
    {
        return $this->routing()[$intent] ?? 'первая линия';
    }

    private function routing(): array
    {
        return [
            'претензия и жалоба' => 'старший специалист',
            'вопрос по заказу' => 'отдел заказов',
            'техническая проблема' => 'вторая линия',
            'спам и реклама' => 'автофильтр',
            'благодарность' => 'закрыть автоматически',
        ];
    }
}
