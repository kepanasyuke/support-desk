<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'knowledge',
    'name' => 'База знаний',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\kb\\controllers',
    'dbPath' => $basePath . '/runtime/knowledge.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'article',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'GET search' => 'search',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
