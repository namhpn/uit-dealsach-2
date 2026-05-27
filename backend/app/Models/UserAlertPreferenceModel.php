<?php

namespace App\Models;

use CodeIgniter\Model;

class UserAlertPreferenceModel extends Model
{
    protected $table            = 'user_alert_preferences';
    protected $primaryKey       = 'user_id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'user_id',
        'alert_emails_enabled',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
