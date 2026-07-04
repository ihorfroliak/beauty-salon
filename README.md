# beauty-salon

Сайт-візитка салону краси **«Світлана»** (Київ).

Односторінковий лендинг із головним акцентом на швидкий запис по телефону:
жіночі та чоловічі стрижки, фарбування волосся, догляд, манікюр, педикюр,
брови/вії, візаж та косметологія.

## Технології
Фронтенд — чистий HTML + CSS + JavaScript, без залежностей.
Форма запису надсилає заявки в **Telegram** через Vercel Serverless Function (`api/callback.js`).

## Запуск
Тільки фронтенд:
```bash
python -m http.server 8000   # http://localhost:8000
```
Разом із формою (Telegram): `vercel dev` (потрібен Vercel CLI та `.env.local`).

## Форма → Telegram: налаштування
1. У Telegram напишіть **@BotFather** → `/newbot` → отримайте `TELEGRAM_BOT_TOKEN`.
2. Дізнайтеся свій `chat_id`: напишіть боту будь-що, потім відкрийте
   `https://api.telegram.org/bot<TOKEN>/getUpdates` і візьміть `chat.id` — це `TELEGRAM_CHAT_ID`.
   (Щоб слати у групу — додайте бота в групу і візьміть її id.)
3. Задеплойте на **Vercel** (`vercel` або через github-імпорт).
4. У Vercel → Project → Settings → **Environment Variables** додайте
   `TELEGRAM_BOT_TOKEN` і `TELEGRAM_CHAT_ID`, потім зробіть **Redeploy**.

Змінні див. у [.env.example](.env.example).

## Що замінити перед публікацією
- Телефон `+380000000000` → реальний номер (у 4 місцях).
- Адресу, e-mail, соцмережі у блоці «Контакти».
- Орієнтовні ціни у прайсі.

Деталі для розробки — у [CLAUDE.md](CLAUDE.md).
