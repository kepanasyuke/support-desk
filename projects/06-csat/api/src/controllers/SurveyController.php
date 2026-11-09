<?php

declare(strict_types=1);

namespace app\csat\controllers;

use app\csat\models\Survey;
use app\csat\services\CsatStatsService;
use app\csat\services\SentimentService;
use Yii;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class SurveyController extends ActiveController
{
    public $modelClass = Survey::class;

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
        return (new CsatStatsService())->summary();
    }

    public function actionAi(int $id): array
    {
        return (new SentimentService())->analyse($this->findOne($id));
    }

    public function actionAnalyseAll(): array
    {
        return $this->analysed(Survey::find()->where(['ai_sentiment' => null])->limit(50)->all());
    }

    private function analysed(array $surveys): array
    {
        return array_map(fn (Survey $survey): array => (new SentimentService())->analyse($survey), $surveys);
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

    private function findOne(int $id): Survey
    {
        return Survey::findOne($id) ?? $this->missing();
    }

    private function missing(): Survey
    {
        throw new NotFoundHttpException('Отзыв не найден');
    }
}
