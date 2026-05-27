<?php

namespace App\Models;

use CodeIgniter\Model;

class PriceAlertEventModel extends Model
{
    protected $table            = 'price_alert_events';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'price_alert_id',
        'event_type',
        'previous_status',
        'new_status',
        'summary_json',
        'created_at',
    ];

    protected $useTimestamps = false;
}
