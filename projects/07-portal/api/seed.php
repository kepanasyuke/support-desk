<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/portal.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS client_request (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT "new",
        ai_category VARCHAR(255) NULL,
        ai_confidence REAL NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM client_request');

$rows = [
    ['ООО «Вектор»', 'buh@vektor.ru', 'Нужен акт сверки за третий квартал', 'Прошу подготовить акт сверки взаиморасчётов за 3 квартал.', 'new'],
    ['ИП Соколов', 'sokolov@mail.ru', 'Не открывается личный кабинет', 'При входе белый экран, пробовал три браузера.', 'in_progress'],
    ['Мария Лебедева', 'm.lebedeva@mail.ru', 'Где мой заказ 4471', 'Заказ оформлен 12 октября, статус не меняется.', 'new'],
    ['Пётр Зайцев', 'p.zaytsev@mail.ru', 'Сброс пароля не приходит на почту', 'Письмо не приходит уже час, папку спам проверил.', 'answered'],
    ['ГК «Альянс»', 'it@alyans.ru', 'Интересует API для выгрузки заявок', 'Нужна документация по методам выгрузки обращений.', 'new'],
    ['ООО «Ритм»', 'info@ritm.ru', 'Ошибка в счёте: неверный ИНН', 'Прошу перевыставить счёт с корректным ИНН.', 'closed'],
];

$insert = $pdo->prepare(
    'INSERT INTO client_request (client, email, subject, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' заявок в ' . $dbPath . PHP_EOL;
