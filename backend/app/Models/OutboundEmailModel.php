<?php

namespace App\Models;

use CodeIgniter\Model;

class OutboundEmailModel extends Model
{
    protected $table            = 'outbound_emails';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'normalized_recipient_email',
        'display_recipient_email',
        'email_type',
        'subject',
        'body_text',
        'metadata_json',
        'status',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
