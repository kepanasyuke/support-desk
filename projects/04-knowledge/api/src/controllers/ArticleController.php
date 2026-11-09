<?php

declare(strict_types=1);

namespace app\kb\controllers;

use app\kb\models\Article;
use app\kb\services\KbStatsService;
use app\kb\services\SearchService;
use Yii;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class ArticleController extends ActiveController
{
    public $modelClass = Article::class;

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
        return (new KbStatsService())->summary();
    }

    public function actionSearch(): array
    {
        return (new SearchService())->search($this->query());
    }

    public function actionAi(int $id): array
    {
        return (new SearchService())->search($this->articleText($id));
    }

    private function query(): string
    {
        return (string) Yii::$app->request->get('q', '');
    }

    private function articleText(int $id): string
    {
        $article = $this->findOne($id);

        return $article->title . ' ' . $article->tags . ' ' . $article->body;
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

    private function findOne(int $id): Article
    {
        return Article::findOne($id) ?? $this->missing();
    }

    private function missing(): Article
    {
        throw new NotFoundHttpException('Статья не найдена');
    }
}
