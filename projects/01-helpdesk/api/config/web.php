<?php

declare(strict_types=1);

use sd\platform\Bootstrap;

$basePath = dirname(__DIR__);

return Bootstrap::config([
    'id' => 'helpdesk',
    'name' => 'Helpdesk',
    'basePath' => $basePath,
    'controllerNamespace' => 'app\\helpdesk\\controllers',
    'dbPath' => $basePath . '/runtime/helpdesk.db',
    'rules' => [
        [
            'class' => 'yii\\rest\\UrlRule',
            'controller' => 'ticket',
            'extraPatterns' => [
                'GET stats' => 'stats',
                'POST {id}/triage' => 'triage',
                'POST {id}/suggest' => 'suggest',
            ],
        ],
    ],
]);
