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
  const service = String(body?.service || '').trim().slice(0, 60);
  const website = String(body?.website || '').trim(); // honeypot-поле проти ботів

  // Якщо приховане поле заповнене — це спам-бот. Вдаємо успіх і нічого не робимо.
  if (website) return res.status(200).json({ ok: true });
  // Посилання в імені — типовий спам. Реальній людині воно не потрібне.
  if (/https?:|www\.|t\.me\//i.test(name)) return res.status(200).json({ ok: true });

  const normalizedPhone = normalizePhone(phone);
  if (!name || !normalizedPhone) {
    return res.status(400).json({ ok: false, error: 'Некоректні дані' });
  }

  // Звичайний текст без parse_mode: дані клієнта не ламають розмітку,
  // а номер у форматі +380… Telegram робить клікабельним для дзвінка.
  const text = [
    '💇 Нова заявка на дзвінок',
    '',
    `👤 Ім'я: ${name}`,
    `📞 Телефон: ${normalizedPhone}`,
    `💅 Послуга: ${service || 'не вказано'}`,
    `🕘 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`,
  ].join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000), // менше за 10 с очікування у браузері
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

// Приводить номер до міжнародного формату. Повертає null, якщо номер некоректний.
// Приймає: 991234567, 0991234567, 80991234567, 380991234567, 00380991234567, іноземні 11–15 цифр.
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^00/, '');
  if (/^\d{9}$/.test(digits)) return `+380${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  if (/^80\d{9}$/.test(digits)) return `+3${digits}`;
  if (/^\d{11,15}$/.test(digits)) return `+${digits}`;
  return null;
}
