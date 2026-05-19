<?php
while (ob_get_level()) ob_end_clean();
ob_start();

$_origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$_allowed = ['https://enfermeriaencasa.net', 'https://www.enfermeriaencasa.net', 'http://localhost:5173'];
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowed) ? $_origin : 'https://enfermeriaencasa.net'));
header('Vary: Origin');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/db.php';

function send(array $data, int $code = 200): void {
    ob_clean();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s',
        $config['host'], $config['db'], $config['charset'] ?? 'utf8mb4');
    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    send(['ok' => false, 'message' => 'No se pudo conectar a la base de datos.'], 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("
        SELECT nombre, distrito, resena, puntuacion, creado_en
        FROM testimonios
        WHERE estado = 'aprobado'
        ORDER BY creado_en DESC
        LIMIT 6
    ");
    send(['ok' => true, 'items' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0')[0]);

    // Máximo 3 reseñas por IP en 24 horas
    $limCheck = $pdo->prepare("SELECT COUNT(*) FROM testimonios WHERE ip = ? AND creado_en > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $limCheck->execute([$ip]);
    if ((int)$limCheck->fetchColumn() >= 3) {
        send(['ok' => false, 'message' => 'Has enviado demasiadas reseñas. Intenta mañana.'], 429);
    }

    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $nombre     = trim($data['nombre']    ?? '');
    $distrito   = trim($data['distrito']  ?? '');
    $resena     = trim($data['resena']    ?? '');
    $puntuacion = max(1, min(5, (int)($data['puntuacion'] ?? 5)));

    if (!$nombre || !$distrito || !$resena) {
        send(['ok' => false, 'message' => 'Nombre, distrito y reseña son obligatorios.'], 422);
    }

    $stmt = $pdo->prepare('
        INSERT INTO testimonios (nombre, distrito, resena, puntuacion, estado, ip)
        VALUES (:nombre, :distrito, :resena, :puntuacion, "pendiente", :ip)
    ');
    $stmt->execute([
        ':nombre'     => mb_substr($nombre,   0, 120),
        ':distrito'   => mb_substr($distrito, 0, 120),
        ':resena'     => mb_substr($resena,   0, 2000),
        ':puntuacion' => $puntuacion,
        ':ip'         => $ip,
    ]);

    send(['ok' => true, 'message' => 'Reseña registrada. Se publicará tras revisión.']);
}

send(['ok' => false, 'message' => 'Método no permitido.'], 405);
