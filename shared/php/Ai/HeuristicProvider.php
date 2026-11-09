<?php

declare(strict_types=1);

namespace sd\platform\ai;

final class HeuristicProvider implements ProviderInterface
{
    private const STOP_WORDS = ['этот', 'эта', 'что', 'как', 'для', 'или', 'при', 'все', 'наш', 'ваш', 'они', 'она'];

    public function name(): string
    {
        return 'heuristic-offline';
    }

    public function classify(string $text, array $labels): array
    {
        return $this->buildResult($text, $labels);
    }

    public function generate(string $task, array $input): array
    {
        return $this->buildGeneration($task, $input);
    }

    private function buildGeneration(string $task, array $input): array
    {
        return [
            'provider' => $this->name(),
            'task' => $task,
            'text' => $this->renderTemplate($task, $input),
            'confidence' => 0.62,
            'model' => 'heuristic-v1',
        ];
    }

    private function renderTemplate(string $task, array $input): string
    {
        return strtr($this->templates()[$task] ?? 'Черновик: {subject}', $this->placeholders($input));
    }

    private function placeholders(array $input): array
    {
        return [
            '{subject}' => (string) ($input['subject'] ?? 'обращение'),
            '{name}' => (string) ($input['client'] ?? 'клиент'),
            '{topic}' => (string) ($input['topic'] ?? 'ваш вопрос'),
        ];
    }

    private function templates(): array
    {
        return [
            'suggest_reply' => 'Здравствуйте, {name}! По обращению «{subject}» вижу, что вопрос касается «{topic}». '
                . 'Передал данные профильному специалисту, ориентировочный срок ответа — 2 часа.',
            'summarize_thread' => 'Клиент обратился по теме «{topic}». Требуется уточнение деталей '
                . 'и подтверждение решения.',
            'kb_search' => 'Подходящие статьи по теме «{topic}» подобраны по совпадению ключевых слов.',
            'load_advice' => 'Нагрузка оператора {name} близка к пределу: стоит перераспределить новые обращения '
                . 'и снять часть задач из очереди.',
        ];
    }

    private function buildResult(string $text, array $labels): array
    {
        return $this->resultFor($labels, $this->scores($labels, $this->tokens($text)));
    }

    private function resultFor(array $labels, array $scores): array
    {
        return $this->payload($this->winner($labels, $scores), $scores);
    }

    private function payload(array $winner, array $scores): array
    {
        return [
            'provider' => $this->name(),
            'label' => $winner['label'],
            'confidence' => $winner['confidence'],
            'scores' => $scores,
        ];
    }

    private function tokens(string $text): array
    {
        $words = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text)) ?: [];

        return $this->meaningful($words);
    }

    private function meaningful(array $words): array
    {
        return array_values(array_filter($words, fn (string $word): bool => $this->isMeaningful($word)));
    }

    private function isMeaningful(string $word): bool
    {
        return mb_strlen($word) > 3 && !in_array($word, self::STOP_WORDS, true);
    }

    private function scores(array $labels, array $tokens): array
    {
        return array_map(fn (string $label): float => $this->overlap($label, $tokens), $labels);
    }

    private function overlap(string $label, array $tokens): float
    {
        return $this->ratio(count(array_intersect($this->labelsTokens($label), $tokens)), max(count($tokens), 1));
    }

    private function ratio(int $hits, int $base): float
    {
        return round(min(1.0, $hits / $base * 4), 3);
    }

    private function labelsTokens(string $label): array
    {
        return $this->tokens($label);
    }

    private function winner(array $labels, array $scores): array
    {
        return ['label' => $labels[$this->bestIndex($scores)] ?? 'other', 'confidence' => $this->bestScore($scores)];
    }

    private function bestScore(array $scores): float
    {
        return $scores ? max($scores) : 0.0;
    }

    private function bestIndex(array $scores): int
    {
        return $scores ? (int) array_search($this->bestScore($scores), $scores, true) : 0;
    }
}
