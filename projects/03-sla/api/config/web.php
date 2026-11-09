<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'sla',
    'name' => 'SLA-монитор',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\sla\\controllers',
    'dbPath' => $basePath . '/runtime/sla.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'sla',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
