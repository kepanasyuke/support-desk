<?php

declare(strict_types=1);

namespace app\portal\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $client
 * @property string $email
 * @property string $subject
 * @property string $body
 * @property string $status
 * @property string|null $ai_category
 * @property float|null $ai_confidence
 * @property string $created_at
 */
final class ClientRequest extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%client_request}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['client', 'email', 'subject', 'body'], 'required'],
            [['body'], 'string'],
            [['client', 'email', 'subject', 'ai_category'], 'string', 'max' => 255],
            [['email'], 'email'],
            [['status'], 'in', 'range' => ['new', 'in_progress', 'answered', 'closed']],
            [['ai_confidence'], 'number', 'min' => 0, 'max' => 1],
            [['created_at'], 'safe'],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    public function beforeSave($insert): bool
    {
        $this->applyDefaults();

        return parent::beforeSave($insert);
    }

    private function applyDefaults(): void
    {
        $this->created_at = $this->created_at ?: date('Y-m-d H:i:s');
        $this->status = $this->status ?: 'new';
    }

    private function exposedFields(): array
    {
        return ['id', 'client', 'email', 'subject', 'body', 'status', 'ai_category', 'ai_confidence', 'created_at'];
    }
}
