// Вспомогательный endpoint для получения chat_id
// После деплоя: напиши своему боту в MAX, затем открой в браузере:
// https://derbent-travel.vercel.app/api/setup
// Скопируй chat_id из ответа и добавь его в Vercel → Environment Variables → MAX_CHAT_ID

export default async function handler(req, res) {
  const BOT_TOKEN = process.env.MAX_BOT_TOKEN;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'MAX_BOT_TOKEN не задан в переменных окружения' });
  }

  try {
    // Получаем список чатов бота
    const response = await fetch('https://platform-api.max.ru/chats?count=10', {
      headers: { 'Authorization': BOT_TOKEN },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Ошибка MAX API', details: data });
    }

    const chats = (data.chats || []).map(c => ({
      chat_id:  c.chat_id,
      type:     c.type,
      title:    c.title || c.type,
    }));

    return res.status(200).json({
      message: 'Скопируй нужный chat_id и добавь его в Vercel → Settings → Environment Variables → MAX_CHAT_ID',
      chats,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Сетевая ошибка', details: err.message });
  }
}
