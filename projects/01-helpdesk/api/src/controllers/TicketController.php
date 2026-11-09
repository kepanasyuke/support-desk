<?php

declare(strict_types=1);

namespace app\helpdesk\controllers;

use app\helpdesk\models\Ticket;
use app\helpdesk\services\StatsService;
use app\helpdesk\services\TriageService;
use Yii;
use yii\filters\Cors;
use yii\rest\ActiveController;
use yii\web\NotFoundHttpException;

final class TicketController extends ActiveController
{
    public $modelClass = Ticket::class;

    public function behaviors(): array
    {
        return $this->withCors(parent::behaviors());
    }

    public function actions(): array
    {
        return $this->withPagination(parent::actions());
    }

    public function actionTriage(int $id): array
    {
        return (new TriageService())->triage($this->findOne($id));
    }

    public function actionSuggest(int $id): array
    {
        return (new TriageService())->suggest($this->findOne($id), $this->tone());
    }

    public function actionStats(): array
    {
        return (new StatsService())->summary();
    }

    private function tone(): string
    {
        return (string) Yii::$app->request->post('tone', 'friendly');
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

    private function findOne(int $id): Ticket
    {
        return Ticket::findOne($id) ?? $this->missing();
    }

    private function missing(): Ticket
    {
        throw new NotFoundHttpException('Тикет не найден');
    }
}
