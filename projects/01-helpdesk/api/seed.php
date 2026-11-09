<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/helpdesk.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        client VARCHAR(255) NOT NULL,
        channel VARCHAR(255) NOT NULL DEFAULT "email",
        status VARCHAR(32) NOT NULL DEFAULT "new",
        priority VARCHAR(32) NOT NULL DEFAULT "normal",
        assignee VARCHAR(255) NULL,
        ai_label VARCHAR(255) NULL,
        ai_confidence REAL NULL,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM ticket');

$rows = [
    ['Не приходит счёт за октябрь', 'Мы оплатили подписку 3 октября, но закрывающие документы не пришли. Бухгалтерия не может провести платёж.', 'ООО «Вектор»', 'email', 'open', 'normal', 'Анна К.'],
    ['Ошибка 500 при выгрузке отчёта', 'Нажимаю «Выгрузить в Excel» и получаю ошибку 500. Пробовали в Chrome и Firefox, повторяется каждый раз.', 'ИП Соколов', 'chat', 'open', 'high', 'Игорь М.'],
    ['Заказ задерживается на 5 дней', 'Курьер не приехал в согласованное время, трек-номер не обновляется с понедельника.', 'Мария Лебедева', 'email', 'pending', 'normal', null],
    ['Не могу войти после смены пароля', 'Сменил пароль по ссылке из письма, теперь система не пускает. Пишет «неверный логин или пароль».', 'Пётр Зайцев', 'chat', 'new', 'high', 'Анна К.'],
    ['Прошу вернуть деньги за дубликат', 'Списали дважды за один и тот же месяц. Прошу вернуть средства на карту.', 'ООО «Сфера»', 'email', 'open', 'high', null],
    ['Как настроить интеграцию с 1С', 'Интересует обмен справочниками. Есть ли документация по API?', 'ГК «Альянс»', 'email', 'resolved', 'low', 'Игорь М.'],
    ['Медленно работает личный кабинет', 'После последнего обновления страницы грузятся по 10–15 секунд.', 'Анна Петрова', 'chat', 'open', 'normal', null],
    ['Ошибка в счёте: неверный ИНН', 'В счёте указан неверный ИНН получателя, прошу перевыставить.', 'ООО «Ритм»', 'email', 'new', 'normal', null],
];

$insert = $pdo->prepare(
    'INSERT INTO ticket (subject, body, client, channel, status, priority, assignee, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' обращений в ' . $dbPath . PHP_EOL;
