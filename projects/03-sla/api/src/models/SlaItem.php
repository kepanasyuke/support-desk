<?php

declare(strict_types=1);

namespace app\sla\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $subject
 * @property string $client
 * @property string $priority
 * @property int $limit_min
 * @property int $elapsed_min
 * @property string $status
 * @property string|null $ai_risk
 * @property float|null $ai_confidence
 * @property string $created_at
 */
final class SlaItem extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%sla_item}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['subject', 'client'], 'required'],
            [['subject', 'client', 'ai_risk'], 'string', 'max' => 255],
            [['limit_min', 'elapsed_min'], 'integer', 'min' => 0],
            [['priority'], 'in', 'range' => ['standard', 'high', 'critical']],
            [['status'], 'in', 'range' => ['running', 'paused', 'met', 'breached']],
            [['ai_confidence'], 'number', 'min' => 0, 'max' => 1],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return [
            'id', 'subject', 'client', 'priority', 'limit_min',
            'elapsed_min', 'status', 'ai_risk', 'ai_confidence', 'created_at',
        ];
    }

    public function getRemaining(): int
    {
        return $this->limit_min - $this->elapsed_min;
    }
}
