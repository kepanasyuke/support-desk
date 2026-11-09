<?php

declare(strict_types=1);

namespace app\inbox\controllers;

use app\inbox\models\Message;
use app\inbox\services\ChannelStatsService;
use app\inbox\services\IntentService;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class MessageController extends ActiveController
{
    public $modelClass = Message::class;

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
        return (new ChannelStatsService())->summary();
    }

    public function actionAi(int $id): array
    {
        return (new IntentService())->classify($this->findOne($id));
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

    private function findOne(int $id): Message
    {
        return Message::findOne($id) ?? $this->missing();
    }

    private function missing(): Message
    {
        throw new NotFoundHttpException('Сообщение не найдено');
    }
}
