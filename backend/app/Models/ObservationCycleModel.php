<?php

namespace App\Models;

use CodeIgniter\Model;

class ObservationCycleModel extends Model
{
    protected $table            = 'observation_cycles';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['cycle_date', 'processed_at', 'notes'];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
