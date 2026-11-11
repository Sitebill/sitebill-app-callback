# Sitebill Callback request app

**EN** · Free, open-source **“Call me back”** app for [Sitebill](https://sitebillcms.com/) — the real-estate CMS / SaaS platform (Community Edition). A visitor leaves a phone number below a listing or with a floating button; the request lands in the site's **CRM as a deal**, managers are **notified** (bell, e-mail, Telegram, Max), and requests are listed in the admin panel. It is also the reference app for the [Sitebill App SDK](https://github.com/Sitebill/sitebill-app-sdk).
**RU** · Бесплатное открытое приложение **«Перезвоните мне»** для [Sitebill](https://www.sitebill.ru/) (сайты и CRM для недвижимости, Community Edition). Посетитель оставляет телефон под объявлением или через плавающую кнопку; заявка попадает **в CRM сделкой**, менеджеры получают **уведомление** (колокольчик, почта, Telegram, Max), заявки видны в админке. Это и эталонное приложение [App SDK](https://github.com/Sitebill/sitebill-app-sdk).

> **Preview 0.x** — works on Community with installable apps (platform 1.3+). / Работает в Community с устанавливаемыми приложениями (платформа 1.3+).

| | |
|---|---|
| 🌍 International / English | **https://sitebillcms.com/** |
| 🇷🇺 Россия и СНГ | **https://www.sitebill.ru/** |
| 🧰 SDK | https://github.com/Sitebill/sitebill-app-sdk |
| 🚀 Starter / Шаблон | https://github.com/Sitebill/sitebill-app-starter |

## Features / Возможности

- Form below the listing card (slot `property.detail`) and an optional floating button on every page (slot `global`).
- Request → contact (deduplicated by phone) + deal in the default CRM pipeline via `Host::crm()->createLead()`; managers are notified like for the built-in site form.
- Spam protection: honeypot field, 5 requests per hour per IP, validation.
- Admin page: new / handled / all, mark handled, link to deals; settings (form on listings, floating button, button text, retention).
- Dashboard widget with the number of new requests.
- Daily cleanup of old requests by the retention setting of each site (`schedule` in `manifest.json`); deals in the CRM stay.
- UI in 4 languages: ru, en, sr, tg.

## Install / Установка

On a Community install with `APPS_ALLOW_UNSIGNED=true` (until it is published in the marketplace):

```bash
git clone https://github.com/Sitebill/sitebill-app-callback
cd sitebill-app-callback && zip -r ../sitebill.callback.zip . -x '.git/*'
```

Admin panel → **Apps → Installed apps → Upload your own package** → choose the zip. Or from the console:
`docker compose cp . api:/tmp/callback && docker compose exec api php artisan apps install /tmp/callback`.

Админка → **Приложения → Установленные приложения → Загрузить свой пакет** → выбрать zip. Затем «Обратный звонок» → «Настройки».

## How it is built / Как устроено

| File | What |
|---|---|
| `manifest.json` | menu, admin page, widgets (`property.detail`, `global`, `admin.dashboard`), daily schedule |
| `api/src/Http/RequestController.php` | public REST: `GET settings`, `POST request` (honeypot, rate limit, `Host::crm()->createLead`) |
| `api/src/GraphQL/CallbackResolver.php` + `api/graphql/schema.graphql` | admin GraphQL (`@guard` + `@can`) |
| `api/src/CallbackSettings.php` | settings via `Host::settings()` |
| `api/src/Console/CleanupCommand.php` | `sitebill-callback:cleanup`, per site via `Host::site()->runAs()` |
| `web/site.mjs`, `web/admin.mjs` | widgets and admin page (plain ESM, Vue shared with the site) |

## License

MIT — see [LICENSE](LICENSE). © Sitebill — [sitebillcms.com](https://sitebillcms.com/) · [sitebill.ru](https://www.sitebill.ru/)
