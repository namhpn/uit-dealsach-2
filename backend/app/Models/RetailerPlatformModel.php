<?php

namespace App\Models;

use CodeIgniter\Model;

class RetailerPlatformModel extends Model
{
    protected $table            = 'retailer_platforms';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['name', 'slug', 'approved_domains', 'status'];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
