<?php

namespace SitebillApps\Sitebill\Callback;

use Sitebill\AppSdk\Host;

/** App settings of the current site, stored by the platform (Host::settings()). */
final class CallbackSettings
{
    public const APP_ID = 'sitebill.callback';

    private const DEFAULTS = [
        'show_on_property' => true,
        'show_floating' => false,
        'button_text' => '',
        'retention_days' => 180,
    ];

    /** @return array{show_on_property: bool, show_floating: bool, button_text: string, retention_days: int} */
    public static function all(): array
    {
        $stored = Host::settings()->all(self::APP_ID);

        return [
            'show_on_property' => (bool) ($stored['show_on_property'] ?? self::DEFAULTS['show_on_property']),
            'show_floating' => (bool) ($stored['show_floating'] ?? self::DEFAULTS['show_floating']),
            'button_text' => (string) ($stored['button_text'] ?? self::DEFAULTS['button_text']),
            'retention_days' => max(7, min(3650, (int) ($stored['retention_days'] ?? self::DEFAULTS['retention_days']))),
        ];
    }

    /** @param array<string, mixed> $input */
    public static function save(array $input): array
    {
        foreach (array_keys(self::DEFAULTS) as $key) {
            if (array_key_exists($key, $input)) {
                $value = match ($key) {
                    'show_on_property', 'show_floating' => (bool) $input[$key],
                    'button_text' => mb_substr(trim((string) $input[$key]), 0, 60),
                    'retention_days' => max(7, min(3650, (int) $input[$key])),
                };
                Host::settings()->set(self::APP_ID, $key, $value);
            }
        }

        return self::all();
    }
}
