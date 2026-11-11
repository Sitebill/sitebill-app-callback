<?php

namespace SitebillApps\Sitebill\Callback\Models;

use Sitebill\AppSdk\AppModel;

/** A "call me back" request left on the site (tenant-scoped). */
class CallbackRequest extends AppModel
{
    protected $table = 'app_sitebill_callback_requests';

    protected $fillable = ['name', 'phone', 'comment', 'property_id', 'lead_id', 'status'];

    protected $casts = [
        'property_id' => 'integer',
        'lead_id' => 'integer',
    ];
}
