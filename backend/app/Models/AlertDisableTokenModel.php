<?php

namespace App\Models;

use CodeIgniter\Model;

class AlertDisableTokenModel extends Model
{
    protected $table            = 'alert_disable_tokens';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'price_alert_id',
        'token_hash',
        'expires_at',
        'used_at',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
