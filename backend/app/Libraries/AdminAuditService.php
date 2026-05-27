<?php

namespace App\Libraries;

use App\Models\AdminAuditLogModel;
use CodeIgniter\I18n\Time;
use DateTimeImmutable;
use DateTimeZone;

class AdminAuditService
{
    private const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

    private AdminAuditLogModel $logs;
    private DateTimeImmutable $now;

    public function __construct(?DateTimeImmutable $now = null)
    {
        $this->logs = new AdminAuditLogModel();
        $this->now = $now ?? new DateTimeImmutable(Time::now(self::VIETNAM_TIMEZONE)->toDateTimeString(), new DateTimeZone(self::VIETNAM_TIMEZONE));
    }

    public function record(object $actor, string $action, string $entityType, string|int $entityId, string $summary, ?array $before, ?array $after): void
    {
        $this->logs->insert([
            'admin_user_id' => (int) $actor->id,
            'actor_email' => (string) $actor->display_email,
            'action_type' => $action,
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'summary' => $summary,
            'before_json' => $before === null ? null : json_encode($this->mask($before), JSON_UNESCAPED_UNICODE),
            'after_json' => $after === null ? null : json_encode($this->mask($after), JSON_UNESCAPED_UNICODE),
            'created_at' => $this->now->format('Y-m-d H:i:s'),
        ]);
    }

    public function list(int $limit = 100): array
    {
        $rows = $this->logs->orderBy('created_at', 'DESC')->orderBy('id', 'DESC')->findAll($limit);

        return array_map(static fn (object $row): array => [
            'id' => (int) $row->id,
            'admin_user_id' => $row->admin_user_id === null ? null : (int) $row->admin_user_id,
            'actor_email' => (string) $row->actor_email,
            'action_type' => (string) $row->action_type,
            'entity_type' => (string) $row->entity_type,
            'entity_id' => (string) $row->entity_id,
            'summary' => (string) $row->summary,
            'before' => $row->before_json === null ? null : json_decode((string) $row->before_json, true),
            'after' => $row->after_json === null ? null : json_decode((string) $row->after_json, true),
            'created_at' => (string) $row->created_at,
        ], $rows);
    }

    private function mask(array $values): array
    {
        $sensitive = ['token', 'token_hash', 'code', 'code_hash', 'password', 'metadata_json', 'body_text'];
        foreach ($values as $key => $value) {
            if (in_array((string) $key, $sensitive, true) || str_contains((string) $key, 'token')) {
                $values[$key] = '[masked]';
            }
        }

        return $values;
    }
}
