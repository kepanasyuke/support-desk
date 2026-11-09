<?php

declare(strict_types=1);

namespace app\portal\controllers;

use app\portal\models\ClientRequest;
use app\portal\services\PortalStatsService;
use app\portal\services\RoutingService;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class RequestController extends ActiveController
{
    public $modelClass = ClientRequest::class;

    public function behaviors(): array
    {
        return $this->withCors(parent::behaviors());
    }

    public function actions(): array
    {
        return $this->withPagination(parent::actions());
    }

    public function actionStats(): array
    {
        return (new PortalStatsService())->summary();
    }

    public function actionAi(int $id): array
    {
        return (new RoutingService())->route($this->findOne($id));
    }

    private function withCors(array $behaviors): array
    {
        $behaviors['cors'] = ['class' => Cors::class];

        return array_diff_key($behaviors, ['rateLimiter' => 1, 'authenticator' => 1]);
    }

    private function withPagination(array $actions): array
    {
        $actions['index']['pagination'] = ['pageSize' => 50];

        return $actions;
    }

    private function findOne(int $id): ClientRequest
    {
        return ClientRequest::findOne($id) ?? $this->missing();
    }

    private function missing(): ClientRequest
    {
        throw new NotFoundHttpException('Заявка не найдена');
    }
}
