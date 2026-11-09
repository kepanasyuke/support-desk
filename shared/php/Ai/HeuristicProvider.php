<?php

declare(strict_types=1);

namespace sd\platform\ai;

final class HeuristicProvider implements ProviderInterface
{
    private const STOP_WORDS = ['этот', 'эта', 'что', 'как', 'для', 'или', 'при', 'все', 'наш', 'ваш', 'они', 'она'];

    private const TOKEN_WEIGHT = 0.35;

    private const FEATURES = [
        'оплата и счета' => [
            'счёт', 'счет', 'оплат', 'платёж', 'платеж', 'инн', 'бухгалтер', 'квитанц', 'тариф', 'подписк',
        ],
        'техническая ошибка' => [
            'ошибк', 'баг', 'выгрузк', 'не работает', 'не открывает', '500', 'зависа', 'тормоз', 'медленн',
            'падает', 'сломал',
        ],
        'доставка и сроки' => ['доставк', 'курьер', 'заказ', 'задерж', 'трек', 'посылк', 'срок', 'привез'],
        'доступ и пароли' => ['парол', 'вход', 'войти', 'логин', 'авторизац', 'блокировк', 'доступ', 'аккаунт'],
        'возврат средств' => ['возврат', 'вернуть', 'деньг', 'списан', 'дубликат', 'компенсац', 'переплат'],
        'претензия и жалоба' => [
            'претензи', 'жалоб', 'недовол', 'возмущ', 'безобраз', 'обман', 'требую', 'хамств', 'верните',
        ],
        'техническая проблема' => [
            'ошибк', 'баг', 'не работает', 'сломал', 'зависа', '500', 'падает', 'код подтверждения',
        ],
        'вопрос по заказу' => ['заказ', 'доставк', 'курьер', 'статус', 'трек', 'посылк', 'наличи', 'оформить'],
        'спам и реклама' => ['реклам', 'рассылк', 'акци', 'скидк', 'предлага', 'продвижен', 'заработок'],
        'благодарность' => ['спасибо', 'благодар', 'признател', 'выручил', 'огромное'],
        'клиент доволен' => [
            'спасибо', 'доволен', 'отлично', 'супер', 'быстро', 'удобно', 'нравится', 'благодар', 'оценка 4',
            'оценка 5', 'оперативн', 'помогли', 'понятн', 'объяснили', 'решили', 'хорошо', 'в порядке', 'рекоменду',
        ],
        'клиент недоволен' => [
            'ужас', 'плохо', 'недовол', 'долго', 'разочаров', 'верните', 'жалоб', 'кошмар', 'оценка 1',
            'оценка 2', 'ужасн', 'не вернули', 'не закрыт', 'напоминать', 'шаблон', 'переспрашивать', 'дважды',
            'трижды', 'отвратит', 'медленн',
        ],
        'нейтральный отзыв' => ['оценка 3', 'нейтральн', 'но пришлось', 'в порядке, но'],
        'оплата и billing' => ['оплат', 'счет', 'счёт', 'платеж', 'платёж', 'тариф', 'подписк', 'биллинг'],
        'технические ошибки' => ['ошибк', 'баг', 'не работает', '500', 'исключен'],
        'доставка и логистика' => ['доставк', 'курьер', 'трек', 'посылк', 'склад'],
        'доступ и безопасность' => ['парол', 'доступ', 'логин', 'авторизац', 'токен', '2fa'],
        'интеграции и API' => ['api', 'интеграц', 'webhook', 'обмен', '1с', 'rest'],
        'оплата и документы' => ['оплат', 'счёт', 'счет', 'документ', 'инн', 'акт', 'фактур'],
        'техническая неисправность' => ['ошибк', 'не работает', 'сломал', '500', 'зависа'],
        'доставка заказа' => ['доставк', 'курьер', 'заказ', 'трек'],
        'доступ к аккаунту' => ['доступ', 'парол', 'вход', 'логин', 'аккаунт'],
        'консультация' => ['консультац', 'подскаж', 'интересует', 'документац', 'вопрос'],
    ];

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
        return $this->resultFor($labels, $this->scores($labels, $text));
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

    private function scores(array $labels, string $text): array
    {
        return array_map(fn (string $label): float => $this->overlap($label, $text), $labels);
    }

    private function overlap(string $label, string $text): float
    {
        return round(min(1.0, $this->featureScore($label, $text) + $this->tokenScore($label, $text)), 3);
    }

    private function featureScore(string $label, string $text): float
    {
        return $this->share($this->hits($label, $text), count($this->features($label)));
    }

    private function tokenScore(string $label, string $text): float
    {
        return $this->share($this->matched($label, $text), count($this->tokens($text))) * self::TOKEN_WEIGHT;
    }

    private function matched(string $label, string $text): int
    {
        return count(array_intersect($this->labelsTokens($label), $this->tokens($text)));
    }

    private function hits(string $label, string $text): int
    {
        return count(array_filter($this->features($label), fn (string $item): bool => $this->found($text, $item)));
    }

    private function found(string $text, string $feature): bool
    {
        return mb_stripos($text, $feature) !== false;
    }

    private function features(string $label): array
    {
        return self::FEATURES[$label] ?? [];
    }

    private function share(int $hits, int $total): float
    {
        return $total > 0 ? min(1.0, $hits / $total * 3) : 0.0;
    }

    private function labelsTokens(string $label): array
    {
        return $this->tokens($label);
    }

    private function winner(array $labels, array $scores): array
    {
        return $this->bestScore($scores) > 0 ? $this->best($labels, $scores) : $this->noLabel();
    }

    private function best(array $labels, array $scores): array
    {
        return ['label' => $labels[$this->bestIndex($scores)] ?? 'other', 'confidence' => $this->bestScore($scores)];
    }

    private function noLabel(): array
    {
        return ['label' => 'без метки', 'confidence' => 0.0];
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
