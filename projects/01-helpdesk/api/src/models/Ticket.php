<?php

declare(strict_types=1);

namespace app\helpdesk\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $subject
 * @property string $body
 * @property string $client
 * @property string $channel
 * @property string $status
 * @property string $priority
 * @property string|null $assignee
 * @property string|null $ai_label
 * @property float|null $ai_confidence
 * @property string $created_at
 */
final class Ticket extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%ticket}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['subject', 'body', 'client'], 'required'],
            [['body'], 'string'],
            [['subject', 'client', 'channel', 'assignee', 'ai_label'], 'string', 'max' => 255],
            [['status', 'priority'], 'string', 'max' => 32],
            [['ai_confidence'], 'number', 'min' => 0, 'max' => 1],
            [['priority'], 'in', 'range' => ['low', 'normal', 'high', 'urgent']],
            [['status'], 'in', 'range' => ['new', 'open', 'pending', 'resolved']],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return [
            'id', 'subject', 'body', 'client', 'channel',
            'status', 'priority', 'assignee', 'ai_label', 'ai_confidence', 'created_at',
        ];
    }
}
