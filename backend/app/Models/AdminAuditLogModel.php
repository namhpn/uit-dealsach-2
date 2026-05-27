<?php

namespace App\Models;

use CodeIgniter\Model;

class AdminAuditLogModel extends Model
{
    protected $table            = 'admin_audit_logs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'admin_user_id',
        'actor_email',
        'action_type',
        'entity_type',
        'entity_id',
        'summary',
        'before_json',
        'after_json',
        'created_at',
    ];
}
