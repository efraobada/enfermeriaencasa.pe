<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/db.php';

try {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['host'],
        $config['db'],
        $config['charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'No se pudo conectar a la base de datos.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT nombre, distrito, resena, puntuacion, creado_en FROM testimonios WHERE estado = 'aprobado' ORDER BY creado_en DESC LIMIT 6");
    echo json_encode([
        'ok' => true,
        'items' => $stmt->fetchAll(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    $nombre = trim($data['nombre'] ?? '');
    $distrito = trim($data['distrito'] ?? '');
    $resena = trim($data['resena'] ?? '');
    $puntuacion = (int) ($data['puntuacion'] ?? 5);

    if ($nombre === '' || $distrito === '' || $resena === '') {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'message' => 'Nombre, distrito y reseña son obligatorios.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($puntuacion < 1 || $puntuacion > 5) {
        $puntuacion = 5;
    }

    $stmt = $pdo->prepare('INSERT INTO testimonios (nombre, distrito, resena, puntuacion, estado) VALUES (:nombre, :distrito, :resena, :puntuacion, :estado)');
    $stmt->execute([
        ':nombre' => mb_substr($nombre, 0, 120),
        ':distrito' => mb_substr($distrito, 0, 120),
        ':resena' => mb_substr($resena, 0, 2000),
        ':puntuacion' => $puntuacion,
        ':estado' => 'pendiente',
    ]);

    echo json_encode([
        'ok' => true,
        'message' => 'Reseña registrada correctamente.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode([
    'ok' => false,
    'message' => 'Método no permitido.',
], JSON_UNESCAPED_UNICODE);
