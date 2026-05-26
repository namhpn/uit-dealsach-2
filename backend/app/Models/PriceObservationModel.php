<?php

namespace App\Models;

use CodeIgniter\Model;

class PriceObservationModel extends Model
{
    protected $table            = 'price_observations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'offer_id',
        'observation_cycle_id',
        'observed_at',
        'availability_status',
        'listed_item_price',
        'book_status_at_observation',
        'offer_status_at_observation',
        'retailer_status_at_observation',
        'merchant_status_at_observation',
        'merchant_retailer_consistent_at_observation',
        'destination_status_at_observation',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
