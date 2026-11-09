<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/sla.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS sla_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject VARCHAR(255) NOT NULL,
        client VARCHAR(255) NOT NULL,
        priority VARCHAR(32) NOT NULL DEFAULT "standard",
        limit_min INTEGER NOT NULL,
        elapsed_min INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT "running",
        ai_risk VARCHAR(255) NULL,
        ai_confidence REAL NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM sla_item');

$rows = [
    ['Сбой оплаты на проде', 'ООО «Вектор»', 'critical', 60, 54, 'running'],
    ['Не приходит письмо с кодом', 'Анна Смирнова', 'high', 120, 118, 'running'],
    ['Вопрос по счёту', 'ИП Соколов', 'standard', 480, 120, 'running'],
    ['Ошибка выгрузки в Excel', 'ГК «Альянс»', 'high', 120, 140, 'breached'],
    ['Задержка доставки', 'Мария Лебедева', 'standard', 480, 460, 'running'],
    ['Дубликат списания', 'ООО «Сфера»', 'critical', 60, 75, 'breached'],
    ['Настройка интеграции с 1С', 'ГК «Альянс»', 'standard', 480, 90, 'met'],
    ['Восстановление доступа', 'Пётр Зайцев', 'high', 120, 30, 'running'],
];

$insert = $pdo->prepare(
    'INSERT INTO sla_item (subject, client, priority, limit_min, elapsed_min, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' SLA-записей в ' . $dbPath . PHP_EOL;
