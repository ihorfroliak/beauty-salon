// Vercel Serverless Function: приймає заявку з форми та надсилає її в Telegram.
// Токен бота та chat_id зберігаються як секретні змінні оточення (Environment Variables)
// у налаштуваннях проєкту на Vercel — вони НЕ потрапляють у фронтенд.
//
// Потрібні змінні оточення:
//   TELEGRAM_BOT_TOKEN  — токен бота від @BotFather
//   TELEGRAM_CHAT_ID    — id чату/групи, куди слати заявки

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  // Тіло може прийти як об'єкт (Vercel парсить JSON) або як рядок
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const name = String(body?.name || '').trim().slice(0, 100);
  const phone = String(body?.phone || '').trim().slice(0, 40);
  const website = String(body?.website || '').trim(); // honeypot-поле проти ботів

  // Якщо приховане поле заповнене — це спам-бот. Вдаємо успіх і нічого не робимо.
  if (website) return res.status(200).json({ ok: true });

  const digits = phone.replace(/\D/g, '');
  if (!name || digits.length < 9) {
    return res.status(400).json({ ok: false, error: 'Некоректні дані' });
  }

  const text =
    `💇 *Нова заявка на дзвінок*\n\n` +
    `👤 Ім'я: ${escapeMd(name)}\n` +
    `📞 Телефон: ${escapeMd(phone)}\n` +
    `🕘 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const data = await tgRes.json();
    if (!data.ok) {
      console.error('Telegram error:', data);
      return res.status(502).json({ ok: false, error: 'Не вдалося надіслати повідомлення' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(502).json({ ok: false, error: 'Помилка мережі' });
  }
}

// Екранування спецсимволів Markdown, щоб ім'я/телефон не ламали розмітку
function escapeMd(s) {
  return s.replace(/([_*`\[\]])/g, '\\$1');
}
