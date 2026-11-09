<?php

declare(strict_types=1);

namespace sd\platform\ai;

interface ProviderInterface
{
    public function name(): string;

    public function classify(string $text, array $labels): array;

    public function generate(string $task, array $input): array;
}
