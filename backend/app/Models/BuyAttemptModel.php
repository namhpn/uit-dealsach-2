<?php

namespace App\Models;

use CodeIgniter\Model;

class BuyAttemptModel extends Model
{
    protected $table            = 'buy_attempts';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'offer_id',
        'book_id',
        'retailer_platform_id',
        'merchant_id',
        'event_at',
        'event_type',
        'attempt_status',
        'destination_domain',
        'destination_path_summary',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
