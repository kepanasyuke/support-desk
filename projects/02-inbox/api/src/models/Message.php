<?php

declare(strict_types=1);

namespace app\inbox\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $channel
 * @property string $author
 * @property string $text
 * @property string $direction
 * @property string $status
 * @property string|null $ai_intent
 * @property float|null $ai_confidence
 * @property string $created_at
 */
final class Message extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%message}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['channel', 'author', 'text'], 'required'],
            [['text'], 'string'],
            [['channel', 'author', 'ai_intent'], 'string', 'max' => 255],
            [['direction'], 'in', 'range' => ['in', 'out']],
            [['status'], 'in', 'range' => ['new', 'assigned', 'closed']],
            [['ai_confidence'], 'number', 'min' => 0, 'max' => 1],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return ['id', 'channel', 'author', 'text', 'direction', 'status', 'ai_intent', 'ai_confidence', 'created_at'];
    }
}
