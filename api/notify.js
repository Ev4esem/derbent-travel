// Vercel Serverless Function — отправляет заявку с сайта в MAX бот
// Переменные окружения в Vercel Dashboard → Settings → Environment Variables:
//   MAX_BOT_TOKEN — токен бота
//   MAX_CHAT_ID   — твой chat_id (получи через /api/setup)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, tour } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }

  const BOT_TOKEN = process.env.MAX_BOT_TOKEN;
  const CHAT_ID   = process.env.MAX_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('MAX_BOT_TOKEN или MAX_CHAT_ID не заданы');
    return res.status(500).json({ error: 'Сервер не настроен. Задай переменные окружения.' });
  }

  const text = [
    '🔔 *Новая заявка с сайта Derbent Travel*',
    '',
    `👤 *Имя:* ${name}`,
    `📞 *Телефон:* ${phone}`,
    `🏔️ *Тур:* ${tour || 'не выбран'}`,
    '',
    `🕐 *Время:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
  ].join('\n');

  try {
    const response = await fetch('https://platform-api.max.ru/messages', {
      method: 'POST',
      headers: {
        'Authorization': BOT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        format: 'markdown',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('MAX API error:', result);
      return res.status(500).json({ error: 'Ошибка MAX API', details: result });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Сетевая ошибка' });
  }
}
