<?php

namespace SitebillApps\Sitebill\Callback\Console;

use Illuminate\Console\Command;
use Sitebill\AppSdk\Host;
use SitebillApps\Sitebill\Callback\CallbackSettings;
use SitebillApps\Sitebill\Callback\Models\CallbackRequest;

/**
 * Deletes old requests per site according to its retention setting. Scheduled by manifest.json
 * ("schedule"). The lead in the CRM is kept: only the app's own copy of the request is removed.
 */
final class CleanupCommand extends Command
{
    protected $signature = 'sitebill-callback:cleanup';

    protected $description = 'Delete callback requests older than the retention period of each site';

    public function handle(): int
    {
        // No site is bound in a console command: walk the sites that have requests.
        $tenantIds = CallbackRequest::withoutGlobalScopes()->distinct()->pluck('tenant_id');
        $deleted = 0;
        foreach ($tenantIds as $tenantId) {
            $deleted += Host::site()->runAs((int) $tenantId, function (): int {
                $days = CallbackSettings::all()['retention_days'];

                return CallbackRequest::query()->where('created_at', '<', now()->subDays($days))->delete();
            });
        }
        $this->info("Deleted: {$deleted}");

        return self::SUCCESS;
    }
}
