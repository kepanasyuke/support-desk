<?php

declare(strict_types=1);

namespace app\suggest\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $ticket_subject
 * @property string $ticket_body
 * @property string $tone
 * @property string $draft_text
 * @property string $provider
 * @property int $accepted
 * @property string $created_at
 */
final class Draft extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%draft}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['ticket_subject', 'ticket_body'], 'required'],
            [['ticket_body', 'draft_text'], 'string'],
            [['ticket_subject', 'tone', 'provider'], 'string', 'max' => 255],
            [['accepted'], 'integer', 'min' => 0, 'max' => 1],
            [['tone'], 'in', 'range' => ['friendly', 'formal', 'short']],
            [['created_at'], 'safe'],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return ['id', 'ticket_subject', 'ticket_body', 'tone', 'draft_text', 'provider', 'accepted', 'created_at'];
    }
}
