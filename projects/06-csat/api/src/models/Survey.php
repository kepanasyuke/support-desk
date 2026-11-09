<?php

declare(strict_types=1);

namespace app\csat\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $client
 * @property int $score
 * @property string $comment
 * @property string $channel
 * @property string $operator
 * @property string|null $ai_sentiment
 * @property float|null $ai_confidence
 * @property string $created_at
 */
final class Survey extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%survey}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['client', 'score'], 'required'],
            [['comment'], 'string'],
            [['client', 'channel', 'operator', 'ai_sentiment'], 'string', 'max' => 255],
            [['score'], 'integer', 'min' => 1, 'max' => 5],
            [['ai_confidence'], 'number', 'min' => 0, 'max' => 1],
            [['created_at'], 'safe'],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return [
            'id', 'client', 'score', 'comment', 'channel',
            'operator', 'ai_sentiment', 'ai_confidence', 'created_at',
        ];
    }
}
