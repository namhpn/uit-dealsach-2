<?php

namespace App\Models;

use CodeIgniter\Model;

class MerchantModel extends Model
{
    protected $table            = 'merchants';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['retailer_platform_id', 'name', 'slug', 'status'];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
