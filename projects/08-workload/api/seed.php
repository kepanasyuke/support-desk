<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/workload.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS operator (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        open_tickets INTEGER NOT NULL DEFAULT 0,
        resolved_today INTEGER NOT NULL DEFAULT 0,
        avg_response_min INTEGER NOT NULL DEFAULT 0,
        capacity INTEGER NOT NULL DEFAULT 10,
        ai_advice VARCHAR(255) NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM operator');

$rows = [
    ['Анна Ковалёва', 'первая линия', 14, 22, 6, 15],
    ['Игорь Мельников', 'первая линия', 9, 18, 9, 15],
    ['Олег Тимофеев', 'вторая линия', 12, 11, 14, 12],
    ['Мария Гусева', 'вторая линия', 4, 16, 7, 12],
    ['Дмитрий Лапин', 'финансовая группа', 11, 8, 21, 10],
    ['Елена Сорокина', 'логистика', 6, 19, 5, 10],
    ['Павел Кузнецов', 'логистика', 10, 12, 11, 10],
];

$insert = $pdo->prepare(
    'INSERT INTO operator (name, team, open_tickets, resolved_today, avg_response_min, capacity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' операторов в ' . $dbPath . PHP_EOL;
