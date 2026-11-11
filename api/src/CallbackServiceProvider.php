<?php

namespace SitebillApps\Sitebill\Callback;

use Sitebill\AppSdk\AppServiceProvider;
use SitebillApps\Sitebill\Callback\Console\CleanupCommand;

/**
 * "Callback request" app. Migrations, GraphQL, REST routes and translations are wired by the
 * platform by convention; here — only the console command used by the schedule in manifest.json.
 */
final class CallbackServiceProvider extends AppServiceProvider
{
    protected function bootApp(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([CleanupCommand::class]);
        }
    }
}
