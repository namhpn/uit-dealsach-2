<?php

namespace App\Commands;

use App\Libraries\AlertNotificationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class EvaluateAlerts extends BaseCommand
{
    protected $group = 'DealSach';
    protected $name = 'alerts:evaluate';
    protected $description = 'Evaluate active price alerts and write outbound alert emails (SMTP when configured).';

    public function run(array $params): void
    {
        $summary = (new AlertNotificationService())->evaluate();

        CLI::write(sprintf(
            'Đã xử lý cảnh báo: evaluated=%d, triggered=%d, emailed=%d, suppressed=%d, failed=%d, baseline_set=%d, expired=%d, auto_paused=%d',
            $summary['evaluated'],
            $summary['triggered'],
            $summary['emailed'],
            $summary['suppressed'],
            $summary['failed'],
            $summary['baseline_set'],
            $summary['expired'],
            $summary['auto_paused'],
        ));
    }
}
