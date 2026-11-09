<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'workload',
    'name' => 'Нагрузка операторов',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\workload\\controllers',
    'dbPath' => $basePath . '/runtime/workload.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'operator',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
