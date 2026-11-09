<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/inbox.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        direction VARCHAR(8) NOT NULL DEFAULT "in",
        status VARCHAR(32) NOT NULL DEFAULT "new",
        ai_intent VARCHAR(255) NULL,
        ai_confidence REAL NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM message');

$rows = [
    ['telegram', 'Ольга Ветрова', 'Третий день не могу получить заказ, курьер не приезжает. Это уже хамство, верните деньги!', 'in', 'new'],
    ['whatsapp', 'Дмитрий К.', 'Подскажите, когда будет в наличии модель X200? Хочу оформить заказ.', 'in', 'assigned'],
    ['email', 'ООО «Гранит»', 'После обновления приложение падает при открытии раздела «Отчёты». Логи прилагаю.', 'in', 'new'],
    ['vk', 'Аноним', 'Заработок от 100000 в день, переходи по ссылке!', 'in', 'closed'],
    ['chat', 'Ирина Полякова', 'Спасибо огромное за оперативную помощь, всё работает!', 'in', 'closed'],
    ['telegram', 'Максим Орлов', 'Хочу вернуть товар, брак на корпусе. Как оформить претензию?', 'in', 'new'],
    ['email', 'Анна Смирнова', 'Не приходит код подтверждения на почту уже 20 минут.', 'in', 'assigned'],
    ['chat', 'Сергей Иванов', 'Уточните, пожалуйста, срок доставки в Казань.', 'in', 'new'],
];

$insert = $pdo->prepare(
    'INSERT INTO message (channel, author, text, direction, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' сообщений в ' . $dbPath . PHP_EOL;
