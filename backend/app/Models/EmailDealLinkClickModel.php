<?php

namespace App\Models;

use CodeIgniter\Model;

class EmailDealLinkClickModel extends Model
{
    protected $table            = 'email_deal_link_clicks';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'email_deal_link_id',
        'price_alert_id',
        'book_id',
        'clicked_at',
        'ip_address',
        'user_agent',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
