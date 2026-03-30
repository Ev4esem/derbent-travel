// Vercel Serverless Function — отправляет заявку с сайта в MAX бот
// Переменные окружения в Vercel Dashboard → Settings → Environment Variables:
//   MAX_BOT_TOKEN — токен бота
//   MAX_USER_ID   — твой user_id из ссылки web.max.ru/XXXXXXX

import { Bot } from '@maxhub/max-bot-api';

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
  const USER_ID   = Number(process.env.MAX_USER_ID);

  if (!BOT_TOKEN || !USER_ID) {
    return res.status(500).json({ error: 'MAX_BOT_TOKEN или MAX_USER_ID не заданы' });
  }

  const text = [
    '🔔 **Новая заявка с сайта Derbent Travel**',
    '',
    `👤 **Имя:** ${name}`,
    `📞 **Телефон:** ${phone}`,
    `🏔️ **Тур:** ${tour || 'не выбран'}`,
    '',
    `🕐 **Время:** ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
  ].join('\n');

  try {
    const bot = new Bot(BOT_TOKEN);
    await bot.api.sendMessageToUser(USER_ID, text, { format: 'markdown' });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('MAX error:', err);
    return res.status(500).json({ error: 'Ошибка отправки в MAX', details: err.message });
  }
}
