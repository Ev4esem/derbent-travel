<?php
// ============================================================
// notify.php — отправляет заявку с сайта в MAX бот
// ============================================================

require_once __DIR__ . '/config.php';

// CORS заголовки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight-запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Принимаем только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получаем тело запроса
$body = json_decode(file_get_contents('php://input'), true);
$name  = trim($body['name']  ?? '');
$phone = trim($body['phone'] ?? '');
$tour  = trim($body['tour']  ?? '');

// Валидация
if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Не заполнены обязательные поля']);
    exit;
}

// Проверяем конфиг
if (MAX_BOT_TOKEN === 'ВСТАВЬ_ТОКЕН_СЮДА' || MAX_USER_ID === 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Токен или user_id не заданы в config.php']);
    exit;
}

// Формируем текст сообщения
$time = (new DateTime('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i');
$text = "🔔 **Новая заявка с сайта Derbent Travel**\n\n"
      . "👤 **Имя:** {$name}\n"
      . "📞 **Телефон:** {$phone}\n"
      . "🏔️ **Тур:** " . ($tour ?: 'не выбран') . "\n\n"
      . "🕐 **Время:** {$time}";

// Отправляем сообщение через MAX Bot API
$payload = json_encode([
    'recipient' => ['user_id' => (int) MAX_USER_ID],
    'type'      => 'message',
    'body'      => [
        'text'   => $text,
        'format' => 'markdown',
    ],
]);

$ch = curl_init('https://platform-api.max.ru/messages');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: ' . MAX_BOT_TOKEN,
    ],
    CURLOPT_TIMEOUT        => 10,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(500);
    echo json_encode(['error' => 'Сетевая ошибка', 'details' => $curlErr]);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка MAX API', 'details' => $response]);
    exit;
}

http_response_code(200);
echo json_encode(['success' => true]);
