<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'inbox',
    'name' => 'Омниканальный инбокс',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\inbox\\controllers',
    'dbPath' => $basePath . '/runtime/inbox.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'message',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
