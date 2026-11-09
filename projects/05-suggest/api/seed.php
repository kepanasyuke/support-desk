<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/runtime/suggest.db';

@mkdir(dirname($dbPath), 0777, true);

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS draft (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_subject VARCHAR(255) NOT NULL,
        ticket_body TEXT NOT NULL,
        tone VARCHAR(32) NOT NULL DEFAULT "friendly",
        draft_text TEXT NOT NULL,
        provider VARCHAR(255) NOT NULL,
        accepted INTEGER NOT NULL DEFAULT 0,
        created_at VARCHAR(32) NOT NULL
    )'
);

$pdo->exec('DELETE FROM draft');

$rows = [
    ['Не приходит счёт за октябрь', 'Оплатили подписку, документы не пришли.', 'friendly',
        'Здравствуйте! Проверил ваш платёж от 3 октября — счёт уже сформирован. Отправлю его повторно на почту бухгалтерии в течение 15 минут.', 'heuristic-offline', 1],
    ['Ошибка 500 при выгрузке отчёта', 'Выгрузка падает с ошибкой.', 'formal',
        'Добрый день. Ошибка 500 при выгрузке связана с размером периода. Рекомендую выгружать данные частями не более одного квартала.', 'heuristic-offline', 1],
    ['Заказ задерживается на 5 дней', 'Курьер не приехал, трек не обновляется.', 'friendly',
        'Здравствуйте! Уточнил статус у службы доставки: посылка на складе в вашем городе. Передал заявку на ускорение, курьер свяжется завтра до 12:00.', 'heuristic-offline', 0],
    ['Не могу войти после смены пароля', 'Система не пускает с новым паролем.', 'short',
        'Сбросил сессию для вашего аккаунта. Попробуйте войти заново — пароль действует. Если ошибка повторится, пришлите время попытки.', 'heuristic-offline', 1],
    ['Возврат средств за дубликат', 'Списали дважды за месяц.', 'formal',
        'Добрый день. Подтверждаю двойное списание. Заявка на возврат создана, средства поступят на исходный способ оплаты в течение 5 рабочих дней.', 'heuristic-offline', 0],
];

$insert = $pdo->prepare(
    'INSERT INTO draft (ticket_subject, ticket_body, tone, draft_text, provider, accepted, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

$createdAt = date('Y-m-d H:i:s');

foreach ($rows as $row) {
    $insert->execute([...$row, $createdAt]);
}

echo 'Готово: ' . count($rows) . ' черновиков в ' . $dbPath . PHP_EOL;
