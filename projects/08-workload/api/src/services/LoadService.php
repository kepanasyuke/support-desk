<?php

declare(strict_types=1);

namespace app\workload\services;

use app\workload\models\Operator;
use sd\platform\ai\AiFactory;

final class LoadService
{
    public function advise(Operator $operator): array
    {
        return $this->apply($operator, $this->generate($operator));
    }

    private function generate(Operator $operator): array
    {
        return AiFactory::make()->generate('load_advice', $this->input($operator));
    }

    private function input(Operator $operator): array
    {
        return [
            'name' => $operator->name,
            'subject' => $operator->team,
            'topic' => 'нагрузка ' . $operator->getUtilisation() . '%',
        ];
    }

    private function apply(Operator $operator, array $generation): array
    {
        $this->persist($operator, $generation);

        return $this->payload($operator, $generation);
    }

    private function persist(Operator $operator, array $generation): void
    {
        $operator->setAttributes(['ai_advice' => (string) $generation['text']]);
        $operator->save(false);
    }

    private function payload(Operator $operator, array $generation): array
    {
        return [
            'operator_id' => (int) $operator->id,
            'name' => $operator->name,
            'utilisation' => $operator->getUtilisation(),
            'band' => $this->band($operator),
            'advice' => (string) $generation['text'],
            'provider' => (string) $generation['provider'],
        ];
    }

    private function band(Operator $operator): string
    {
        return $this->bands()[$this->bucket($operator)] ?? 'норма';
    }

    private function bucket(Operator $operator): string
    {
        return $operator->getUtilisation() >= 90 ? 'critical' : ($operator->getUtilisation() >= 70 ? 'high' : 'ok');
    }

    private function bands(): array
    {
        return [
            'critical' => 'перегрузка',
            'high' => 'повышенная нагрузка',
            'ok' => 'норма',
        ];
    }
}
