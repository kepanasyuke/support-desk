<?php

declare(strict_types=1);

namespace app\sla\controllers;

use app\sla\models\SlaItem;
use app\sla\services\RiskService;
use app\sla\services\SlaStatsService;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class SlaController extends ActiveController
{
    public $modelClass = SlaItem::class;

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
        return (new SlaStatsService())->summary();
    }

    public function actionAi(int $id): array
    {
        return (new RiskService())->assess($this->findOne($id));
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

    private function findOne(int $id): SlaItem
    {
        return SlaItem::findOne($id) ?? $this->missing();
    }

    private function missing(): SlaItem
    {
        throw new NotFoundHttpException('SLA-запись не найдена');
    }
}
