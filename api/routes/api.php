<?php

use Illuminate\Support\Facades\Route;
use SitebillApps\Sitebill\Callback\Http\RequestController;

// Under /api/v1/apps/sitebill.callback/ with the site's session and current tenant (added by the platform).
Route::get('settings', [RequestController::class, 'settings'])->name('settings');
Route::post('request', [RequestController::class, 'store'])->name('request');
