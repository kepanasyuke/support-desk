<?php

declare(strict_types=1);

namespace app\kb\models;

use yii\db\ActiveRecord;

/**
 * @property int $id
 * @property string $title
 * @property string $body
 * @property string $category
 * @property string $tags
 * @property int $views
 * @property string $updated_at
 */
final class Article extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%article}}';
    }

    public function rules(): array
    {
        return $this->validationRules();
    }

    private function validationRules(): array
    {
        return [
            [['title', 'body', 'category'], 'required'],
            [['body'], 'string'],
            [['title', 'category', 'tags'], 'string', 'max' => 255],
            [['views'], 'integer', 'min' => 0],
        ];
    }

    public function fields(): array
    {
        return $this->exposedFields();
    }

    private function exposedFields(): array
    {
        return ['id', 'title', 'body', 'category', 'tags', 'views', 'updated_at'];
    }
}
