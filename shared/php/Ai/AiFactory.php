<?php

declare(strict_types=1);

namespace sd\platform\ai;

final class AiFactory
{
    public static function make(): ProviderInterface
    {
        return self::fromEnv();
    }

    private static function fromEnv(): ProviderInterface
    {
        $key = (string) getenv('SD_AI_API_KEY');

        return $key === '' ? new HeuristicProvider() : self::llm($key);
    }

    private static function llm(string $key): ProviderInterface
    {
        return new OpenAiProvider($key, self::baseUrl(), self::model());
    }

    private static function baseUrl(): string
    {
        return (string) (getenv('SD_AI_BASE_URL') ?: 'https://api.openai.com/v1');
    }

    private static function model(): string
    {
        return (string) (getenv('SD_AI_MODEL') ?: 'gpt-4o-mini');
    }
}
