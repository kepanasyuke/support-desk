<?php

declare(strict_types=1);

namespace sd\platform;

use yii\db\Connection;
use yii\web\JsonParser;
use yii\web\Response;

final class Bootstrap
{
    public static function config(array $params): array
    {
        return self::build($params);
    }

    private static function build(array $params): array
    {
        return [
            'id' => $params['id'],
            'name' => $params['name'],
            'basePath' => $params['basePath'],
            'controllerNamespace' => $params['controllerNamespace'],
            'components' => self::components($params),
            'params' => $params['params'] ?? [],
        ];
    }

    private static function components(array $params): array
    {
        return [
            'db' => self::db($params),
            'request' => self::request(),
            'response' => self::response(),
            'urlManager' => self::urlManager($params),
        ];
    }

    private static function db(array $params): array
    {
        return ['class' => Connection::class, 'dsn' => $params['dsn'] ?? self::sqliteDsn($params)];
    }

    private static function sqliteDsn(array $params): string
    {
        return 'sqlite:' . $params['dbPath'];
    }

    private static function request(): array
    {
        return self::requestConfig();
    }

    private static function requestConfig(): array
    {
        return [
            'parsers' => ['application/json' => JsonParser::class],
            'enableCsrfValidation' => false,
            'enableCookieValidation' => false,
        ];
    }

    private static function response(): array
    {
        return ['format' => Response::FORMAT_JSON, 'charset' => 'UTF-8'];
    }

    private static function urlManager(array $params): array
    {
        return self::urlManagerConfig($params['rules'] ?? []);
    }

    private static function urlManagerConfig(array $rules): array
    {
        return [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'enableStrictParsing' => false,
            'rules' => $rules,
        ];
    }
}
