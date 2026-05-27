<?php

namespace App\Models;

use CodeIgniter\Model;

class PriceAlertModel extends Model
{
    protected $table            = 'price_alerts';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'user_id',
        'book_id',
        'alert_type',
        'status',
        'target_price',
        'baseline_price',
        'baseline_pending',
        'comparison_price',
        'last_notified_price',
        'notification_count',
        'expires_at',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
