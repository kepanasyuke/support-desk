<?php

declare(strict_types=1);

namespace sd\platform\ai;

use RuntimeException;

final class OpenAiProvider implements ProviderInterface
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $baseUrl,
        private readonly string $model,
        private readonly int $timeout = 30,
    ) {
    }

    public function name(): string
    {
        return 'llm:' . $this->model;
    }

    public function classify(string $text, array $labels): array
    {
        $prompt = $this->classificationPrompt($text, $labels);

        return $this->parseClassification($this->request($prompt));
    }

    public function generate(string $task, array $input): array
    {
        $reply = $this->request($this->generationPrompt($task, $input));

        return $this->generationResult($task, $reply);
    }

    private function generationResult(string $task, string $text): array
    {
        return [
            'provider' => $this->name(),
            'task' => $task,
            'text' => $text,
            'model' => $this->model,
        ];
    }

    private function generationPrompt(string $task, array $input): string
    {
        return 'Задача: ' . $task . '. Данные: ' . json_encode($input, JSON_UNESCAPED_UNICODE)
            . '. Ответ на русском, кратко.';
    }

    private function classificationPrompt(string $text, array $labels): string
    {
        return 'Верни только JSON {"label": "одна из ' . implode('|', $labels) . '", "confidence": 0..1}. '
            . 'Текст обращения: ' . $text;
    }

    private function parseClassification(string $raw): array
    {
        $decoded = json_decode($raw, true);

        return $this->normalizeClassification($decoded);
    }

    private function normalizeClassification($decoded): array
    {
        $isValid = is_array($decoded) && isset($decoded['label']);

        return $isValid ? $this->classificationPayload($decoded) : $this->classificationFallback();
    }

    private function classificationPayload(array $decoded): array
    {
        return [
            'provider' => $this->name(),
            'label' => (string) $decoded['label'],
            'confidence' => (float) ($decoded['confidence'] ?? 0.5),
        ];
    }

    private function classificationFallback(): array
    {
        return ['provider' => $this->name(), 'label' => 'other', 'confidence' => 0.0];
    }

    private function request(string $prompt): string
    {
        $response = $this->send($this->payload($prompt));

        return $this->extractText($response);
    }

    private function payload(string $prompt): array
    {
        return [
            'model' => $this->model,
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'temperature' => 0.2,
        ];
    }

    private function send(array $payload): array
    {
        return $this->response($this->executed($payload));
    }

    private function executed(array $payload): array
    {
        $curl = $this->curl($payload);

        return ['raw' => curl_exec($curl), 'status' => (int) curl_getinfo($curl, CURLINFO_HTTP_CODE)];
    }

    private function response(array $result): array
    {
        return $this->ensureSuccess($result['raw'], $result['status']);
    }

    private function curl(array $payload)
    {
        return $this->configured(curl_init(rtrim($this->baseUrl, '/') . '/chat/completions'), $payload);
    }

    private function configured($curl, array $payload)
    {
        curl_setopt_array($curl, $this->curlOptions($payload));

        return $curl;
    }

    private function curlOptions(array $payload): array
    {
        return [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $this->headers(),
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        ];
    }

    private function headers(): array
    {
        return ['Content-Type: application/json', 'Authorization: Bearer ' . $this->apiKey];
    }

    private function ensureSuccess($raw, int $status): array
    {
        $isOk = $status >= 200 && $status < 300 && is_string($raw);

        return $isOk ? (json_decode($raw, true) ?: []) : $this->fail($status);
    }

    private function fail(int $status): array
    {
        throw new RuntimeException('LLM request failed with status ' . $status);
    }

    private function extractText(array $response): string
    {
        return (string) ($response['choices'][0]['message']['content'] ?? '');
    }
}
