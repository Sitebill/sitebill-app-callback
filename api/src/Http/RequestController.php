<?php

namespace SitebillApps\Sitebill\Callback\Http;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Sitebill\AppSdk\Host;
use SitebillApps\Sitebill\Callback\CallbackSettings;
use SitebillApps\Sitebill\Callback\Models\CallbackRequest;

/**
 * Public endpoints of the widget. The form is anonymous, so spam protection is here:
 * a honeypot field and a per-IP limit.
 */
final class RequestController
{
    private const MAX_PER_HOUR = 5;

    /** GET /api/v1/apps/sitebill.callback/settings — what the widgets need to know (public). */
    public function settings(): JsonResponse
    {
        $s = CallbackSettings::all();

        return response()->json([
            'show_on_property' => $s['show_on_property'],
            'show_floating' => $s['show_floating'],
            'button_text' => $s['button_text'],
        ]);
    }

    /** POST /api/v1/apps/sitebill.callback/request */
    public function store(Request $request): JsonResponse
    {
        $site = Host::site()->current();
        abort_unless($site, 404);

        // Bots fill every field; a person never sees this one. Answer "ok" so the bot learns nothing.
        if (filled($request->input('website'))) {
            Log::notice('sitebill.callback: honeypot', ['tenant_id' => $site->tenantId, 'ip' => $request->ip()]);

            return response()->json(['ok' => true], 201);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'min:5', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'comment' => ['nullable', 'string', 'max:500'],
            'property_id' => ['nullable', 'integer'],
        ]);

        $key = 'sitebill-callback:'.$site->tenantId.':'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_PER_HOUR)) {
            return response()->json(['message' => __('Too many requests. Please try again later.')], 429);
        }
        RateLimiter::hit($key, 3600);

        // Only a listing of this site can be attached.
        $property = isset($data['property_id']) ? Host::properties()->find((int) $data['property_id']) : null;

        $message = trim(implode("\n", array_filter([
            $data['comment'] ?? null,
            $property ? "{$property->title} {$property->url}" : null,
        ])));

        $lead = Host::crm()->createLead([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'message' => $message !== '' ? $message : null,
            'property_id' => $property?->id,
            'source' => CallbackSettings::APP_ID,
        ]);

        CallbackRequest::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'comment' => $data['comment'] ?? null,
            'property_id' => $property?->id,
            'lead_id' => $lead->id,
            'status' => 'new',
        ]);

        return response()->json(['ok' => true], 201);
    }
}
