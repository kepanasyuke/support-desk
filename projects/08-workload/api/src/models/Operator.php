<?php

declare(strict_types=1);

namespace app\workload\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $name
 * @property string $team
 * @property int $open_tickets
 * @property int $resolved_today
 * @property int $avg_response_min
 * @property int $capacity
 * @property string|null $ai_advice
 * @property string $created_at
 */
final class Operator extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%operator}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['name', 'team'], 'required'],
            [['name', 'team', 'ai_advice'], 'string', 'max' => 255],
            [['open_tickets', 'resolved_today', 'avg_response_min', 'capacity'], 'integer', 'min' => 0],
            [['capacity'], 'integer', 'min' => 1],
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
            'id', 'name', 'team', 'open_tickets', 'resolved_today',
            'avg_response_min', 'capacity', 'ai_advice', 'created_at',
        ];
    }

    public function getUtilisation(): int
    {
        return $this->capacity > 0 ? (int) round(($this->open_tickets / $this->capacity) * 100) : 0;
    }
}
