<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'csat',
    'name' => 'Аналитика CSAT',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\csat\\controllers',
    'dbPath' => $basePath . '/runtime/csat.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'survey',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST analyse-all' => 'analyse-all',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
