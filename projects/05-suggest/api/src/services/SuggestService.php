<?php

declare(strict_types=1);

namespace app\suggest\services;

use app\suggest\models\Draft;
use sd\platform\ai\AiFactory;

final class SuggestService
{
    public function create(array $input): array
    {
        return $this->store($input, $this->generate($input));
    }

    public function regenerate(Draft $draft): array
    {
        return $this->store($this->asInput($draft), $this->generate($this->asInput($draft)));
    }

    private function generate(array $input): array
    {
        return AiFactory::make()->generate('suggest_reply', $this->withTopic($input));
    }

    private function withTopic(array $input): array
    {
        return ['topic' => (string) ($input['subject'] ?? 'обращение')] + $input;
    }

    private function asInput(Draft $draft): array
    {
        return [
            'subject' => $draft->ticket_subject,
            'body' => $draft->ticket_body,
            'tone' => $draft->tone,
            'topic' => $draft->ticket_subject,
        ];
    }

    private function store(array $input, array $generation): array
    {
        return $this->payload($this->persist($input, $generation), $generation);
    }

    private function persist(array $input, array $generation): Draft
    {
        return $this->saved($this->filled(new Draft(), $this->attributes($input, $generation)));
    }

    private function filled(Draft $draft, array $attributes): Draft
    {
        $draft->setAttributes($attributes);

        return $draft;
    }

    private function saved(Draft $draft): Draft
    {
        $draft->save(false);

        return $draft;
    }

    private function attributes(array $input, array $generation): array
    {
        return [
            'ticket_subject' => (string) ($input['subject'] ?? 'Без темы'),
            'ticket_body' => (string) ($input['body'] ?? ''),
            'tone' => (string) ($input['tone'] ?? 'friendly'),
            'draft_text' => (string) $generation['text'],
            'provider' => (string) $generation['provider'],
            'accepted' => 0,
            'created_at' => date('Y-m-d H:i:s'),
        ];
    }

    private function payload(Draft $draft, array $generation): array
    {
        return [
            'id' => (int) $draft->id,
            'draft' => $draft->draft_text,
            'tone' => $draft->tone,
            'provider' => $draft->provider,
            'model' => (string) ($generation['model'] ?? 'unknown'),
        ];
    }
}
