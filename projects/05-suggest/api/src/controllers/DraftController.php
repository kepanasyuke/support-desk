<?php

declare(strict_types=1);

namespace app\suggest\controllers;

use app\suggest\models\Draft;
use app\suggest\services\DraftStatsService;
use app\suggest\services\SuggestService;
use Yii;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class DraftController extends ActiveController
{
    public $modelClass = Draft::class;

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
        return (new DraftStatsService())->summary();
    }

    public function actionGenerate(): array
    {
        return (new SuggestService())->create($this->payload());
    }

    public function actionAi(int $id): array
    {
        return (new SuggestService())->regenerate($this->findOne($id));
    }

    private function payload(): array
    {
        return (array) Yii::$app->request->post();
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

    private function findOne(int $id): Draft
    {
        return Draft::findOne($id) ?? $this->missing();
    }

    private function missing(): Draft
    {
        throw new NotFoundHttpException('Черновик не найден');
    }
}
