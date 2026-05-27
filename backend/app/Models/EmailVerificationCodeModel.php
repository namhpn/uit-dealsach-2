<?php

namespace App\Models;

use CodeIgniter\Model;

class EmailVerificationCodeModel extends Model
{
    protected $table            = 'email_verification_codes';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'normalized_email',
        'display_email',
        'code_hash',
        'status',
        'failed_attempts',
        'requested_at',
        'expires_at',
        'used_at',
        'invalidated_at',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
