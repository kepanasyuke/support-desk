<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/csat.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS survey (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client VARCHAR(255) NOT NULL,
        score INTEGER NOT NULL,
        comment TEXT NOT NULL DEFAULT "",
        channel VARCHAR(255) NOT NULL DEFAULT "email",
        operator VARCHAR(255) NOT NULL DEFAULT "",
        ai_sentiment VARCHAR(255) NULL,
        ai_confidence REAL NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM survey');

$rows = [
    ['ООО «Вектор»', 5, 'Всё решили за один день, спасибо за оперативность!', 'email', 'Анна К.'],
    ['ИП Соколов', 2, 'Ждал ответа два дня, вопрос так и не закрыт.', 'chat', 'Игорь М.'],
    ['Мария Лебедева', 4, 'Помогли с доставкой, но пришлось напоминать.', 'email', 'Анна К.'],
    ['Пётр Зайцев', 3, 'Ответили по шаблону, пришлось переспрашивать.', 'chat', 'Игорь М.'],
    ['ООО «Сфера»', 1, 'Списали деньги дважды и не вернули. Ужасный сервис.', 'email', 'Анна К.'],
    ['ГК «Альянс»', 5, 'Интеграцию настроили быстро, документация понятная.', 'email', 'Олег Т.'],
    ['Анна Петрова', 4, 'Всё в порядке, но страницы грузятся медленно.', 'chat', 'Олег Т.'],
    ['ООО «Ритм»', 2, 'Счёт перевыставляли трижды, каждый раз с ошибкой.', 'email', 'Игорь М.'],
    ['Сергей Иванов', 5, 'Отличная поддержка, всё объяснили.', 'chat', 'Анна К.'],
    ['Ирина Полякова', 3, 'Нейтрально: сделали, но долго.', 'email', 'Олег Т.'],
];

$insert = $pdo->prepare(
    'INSERT INTO survey (client, score, comment, channel, operator, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' отзывов в ' . $dbPath . PHP_EOL;
