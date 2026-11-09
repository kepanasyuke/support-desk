<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'suggest',
    'name' => 'AI-подсказки ответов',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\suggest\\controllers',
    'dbPath' => $basePath . '/runtime/suggest.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'draft',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST generate' => 'generate',
                'POST {id}/ai' => 'ai',
            ],
        ],
    ],
]);
