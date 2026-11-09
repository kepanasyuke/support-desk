<?php

declare(strict_types=1);

namespace app\workload\controllers;

use app\workload\models\Operator;
use app\workload\services\LoadService;
use app\workload\services\WorkloadStatsService;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class OperatorController extends ActiveController
{
    public $modelClass = Operator::class;

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
        return (new WorkloadStatsService())->summary();
    }

    public function actionAi(int $id): array
    {
        return (new LoadService())->advise($this->findOne($id));
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

    private function findOne(int $id): Operator
    {
        return Operator::findOne($id) ?? $this->missing();
    }

    private function missing(): Operator
    {
        throw new NotFoundHttpException('Оператор не найден');
    }
}
