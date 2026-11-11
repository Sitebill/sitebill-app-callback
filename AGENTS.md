# AGENTS.md — Sitebill Callback request app

Reference installable app for Sitebill (Laravel PHP 8.4 + Vue 3). Product: https://sitebillcms.com/ · https://www.sitebill.ru/
Contract and rules: https://github.com/Sitebill/sitebill-app-sdk (`AGENTS.md` there).

- Platform access only through `Sitebill\AppSdk\Host` (site, settings, crm, properties, notifier); no `App\…` classes.
- Table `app_sitebill_callback_requests` (with `tenant_id`), model extends `Sitebill\AppSdk\AppModel`.
- Public REST (`api/routes/api.php`) is anonymous: keep the honeypot and the rate limit in `RequestController`.
- Admin GraphQL fields: always `@guard` + `@can(ability: "admin", model: "Tenant")`.
- Console/queue code has no site bound: wrap per-site work in `Host::site()->runAs($tenantId, fn () => …)`.
- Strings: `locales/{ru,en,sr,tg}.json`, all four in sync. Bump `version` in `manifest.json` on every release.
