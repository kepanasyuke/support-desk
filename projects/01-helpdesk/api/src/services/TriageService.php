<?php

declare(strict_types=1);

namespace app\helpdesk\services;

use app\helpdesk\models\Ticket;
use sd\platform\ai\AiFactory;

final class TriageService
{
    private const LABELS = [
        'оплата и счета',
        'техническая ошибка',
        'доставка и сроки',
        'доступ и пароли',
        'возврат средств',
    ];

    public function triage(Ticket $ticket): array
    {
        return $this->applyTriage($ticket, $this->classify($ticket));
    }

    public function suggest(Ticket $ticket, string $tone): array
    {
        return $this->buildSuggestion($ticket, $this->generate($ticket, $tone));
    }

    private function classify(Ticket $ticket): array
    {
        return AiFactory::make()->classify($this->ticketText($ticket), self::LABELS);
    }

    private function ticketText(Ticket $ticket): string
    {
        return trim($ticket->subject . '. ' . $ticket->body);
    }

    private function applyTriage(Ticket $ticket, array $result): array
    {
        $this->persistTriage($ticket, $result);

        return $this->triagePayload($ticket, $result);
    }

    private function persistTriage(Ticket $ticket, array $result): void
    {
        $ticket->setAttributes($this->triageAttributes($result));
        $ticket->save(false);
    }

    private function triageAttributes(array $result): array
    {
        return [
            'ai_label' => (string) $result['label'],
            'ai_confidence' => (float) $result['confidence'],
            'priority' => $this->priorityFor((string) $result['label']),
        ];
    }

    private function priorityFor(string $label): string
    {
        return $this->priorityMap()[$label] ?? 'normal';
    }

    private function priorityMap(): array
    {
        return [
            'техническая ошибка' => 'urgent',
            'доступ и пароли' => 'high',
            'возврат средств' => 'high',
            'оплата и счета' => 'normal',
            'доставка и сроки' => 'normal',
        ];
    }

    private function triagePayload(Ticket $ticket, array $result): array
    {
        return [
            'ticket_id' => (int) $ticket->id,
            'label' => (string) $result['label'],
            'confidence' => (float) $result['confidence'],
            'priority' => $ticket->priority,
            'provider' => (string) ($result['provider'] ?? 'unknown'),
        ];
    }

    private function generate(Ticket $ticket, string $tone): array
    {
        return AiFactory::make()->generate('suggest_reply', $this->generationInput($ticket, $tone));
    }

    private function generationInput(Ticket $ticket, string $tone): array
    {
        return [
            'subject' => $ticket->subject,
            'topic' => (string) ($ticket->ai_label ?? 'обращение'),
            'client' => $ticket->client,
            'tone' => $tone,
            'body' => $ticket->body,
        ];
    }

    private function buildSuggestion(Ticket $ticket, array $generation): array
    {
        return [
            'ticket_id' => (int) $ticket->id,
            'draft' => (string) $generation['text'],
            'provider' => (string) $generation['provider'],
            'label' => $ticket->ai_label,
        ];
    }
}
