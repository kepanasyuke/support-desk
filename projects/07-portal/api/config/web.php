<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'portal',
    'name' => 'Портал клиента',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\portal\\controllers',
    'dbPath' => $basePath . '/runtime/portal.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'request',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
