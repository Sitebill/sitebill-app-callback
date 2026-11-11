<?php

namespace SitebillApps\Sitebill\Callback\GraphQL;

use Sitebill\AppSdk\Host;
use SitebillApps\Sitebill\Callback\CallbackSettings;
use SitebillApps\Sitebill\Callback\Models\CallbackRequest;

/** Admin GraphQL of the app. Permissions are checked by @guard + @can in the schema. */
final class CallbackResolver
{
    public function requests(mixed $root, array $args): array
    {
        $query = CallbackRequest::query()->orderByDesc('id')->limit(max(1, min(500, (int) ($args['limit'] ?? 100))));
        if (! empty($args['status'])) {
            $query->where('status', $args['status']);
        }

        return $query->get()->map(fn (CallbackRequest $r) => $this->row($r))->all();
    }

    public function stats(): array
    {
        return [
            'new' => CallbackRequest::query()->where('status', 'new')->count(),
            'total' => CallbackRequest::query()->count(),
        ];
    }

    public function settings(): array
    {
        return CallbackSettings::all();
    }

    public function setStatus(mixed $root, array $args): array
    {
        $request = CallbackRequest::query()->findOrFail($args['id']);
        $request->update(['status' => $args['status']]);

        return $this->row($request);
    }

    public function saveSettings(mixed $root, array $args): array
    {
        return CallbackSettings::save($args['input'] ?? []);
    }

    private function row(CallbackRequest $r): array
    {
        $property = $r->property_id ? Host::properties()->find($r->property_id) : null;

        return [
            'id' => (string) $r->id,
            'name' => $r->name,
            'phone' => $r->phone,
            'comment' => $r->comment,
            'property_id' => $r->property_id,
            'property_title' => $property?->title,
            'property_url' => $property?->url,
            'lead_id' => $r->lead_id,
            'status' => $r->status,
            'created_at' => $r->created_at?->toIso8601String() ?? '',
        ];
    }
}
