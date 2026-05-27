<?php

namespace App\Models;

use CodeIgniter\Model;

class EmailDealLinkModel extends Model
{
    protected $table            = 'email_deal_links';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'price_alert_id',
        'outbound_email_id',
        'book_id',
        'token_hash',
        'landing_path',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
