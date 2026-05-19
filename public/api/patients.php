<?php
$_origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$_allowed = ['https://enfermeriaencasa.net', 'https://www.enfermeriaencasa.net', 'http://localhost:5173'];
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowed) ? $_origin : 'https://enfermeriaencasa.net'));
header('Vary: Origin');
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Staff-Token");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$cfg = require __DIR__ . '/db.php';
try {
    $dsn = "mysql:host={$cfg['host']};dbname={$cfg['db']};charset={$cfg['charset']}";
    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'message' => 'Error de conexión.']); exit;
}

function ok(array $data = [])  { echo json_encode(['ok' => true]  + $data); exit; }
function fail(string $msg, int $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $msg]); exit;
}
function readToken(): string {
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $k) {
        $h = $_SERVER[$k] ?? '';
        if ($h && preg_match('/^Bearer\s+(.+)$/i', $h, $m)) return $m[1];
    }
    if (function_exists('apache_request_headers')) {
        $hdrs = apache_request_headers();
        $h = $hdrs['Authorization'] ?? $hdrs['authorization'] ?? '';
        if ($h && preg_match('/^Bearer\s+(.+)$/i', $h, $m)) return $m[1];
    }
    return $_SERVER['HTTP_X_STAFF_TOKEN'] ?? '';
}
function requireAuth(PDO $pdo): array {
    $token = readToken();
    if (!$token) fail('No autenticado.', 401);
    $st = $pdo->prepare("
        SELECT p.id, p.nombre, p.rol
        FROM sesiones s JOIN personal p ON p.id = s.personal_id
        WHERE s.token = ? AND s.expira_en > NOW() AND p.activo = 1
    ");
    $st->execute([$token]);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    if (!$user) fail('Sesión expirada.', 401);
    return $user;
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$user   = requireAuth($pdo);

// ── GET: listar pacientes activos ─────────────────────────────────────────────
if ($method === 'GET') {
    $search = '%' . ($_GET['q'] ?? '') . '%';
    $st = $pdo->prepare("
        SELECT id, nombre, edad, genero, dni, telefono, direccion, distrito, diagnostico, estado, creado_en
        FROM pacientes
        WHERE activo = 1 AND nombre LIKE ?
        ORDER BY nombre ASC
    ");
    $st->execute([$search]);
    ok(['items' => $st->fetchAll(PDO::FETCH_ASSOC)]);
}

// ── POST: crear paciente ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $nombre = trim($body['nombre'] ?? '');
    if (!$nombre) fail('El nombre del paciente es requerido.');

    $genero = in_array($body['genero'] ?? '', ['masculino','femenino','otro']) ? $body['genero'] : null;
    $estado = in_array($body['estado'] ?? '', ['activo','en_tratamiento','dado_de_alta','derivado']) ? $body['estado'] : 'activo';
    $st = $pdo->prepare("
        INSERT INTO pacientes (nombre, edad, genero, dni, telefono, direccion, distrito, diagnostico, estado, creado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $st->execute([
        $nombre,
        $body['edad']        ?: null,
        $genero,
        $body['dni']         ?: null,
        $body['telefono']    ?: null,
        $body['direccion']   ?: null,
        $body['distrito']    ?: null,
        $body['diagnostico'] ?: null,
        $estado,
        $user['id'],
    ]);
    $id = $pdo->lastInsertId();
    $st = $pdo->prepare("SELECT * FROM pacientes WHERE id = ?");
    $st->execute([$id]);
    ok(['patient' => $st->fetch(PDO::FETCH_ASSOC)]);
}

// ── PUT: actualizar paciente ──────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID de paciente requerido.');
    $genero = in_array($body['genero'] ?? '', ['masculino','femenino','otro']) ? $body['genero'] : null;
    $estado = in_array($body['estado'] ?? '', ['activo','en_tratamiento','dado_de_alta','derivado']) ? $body['estado'] : 'activo';
    $st = $pdo->prepare("
        UPDATE pacientes SET nombre=?, edad=?, genero=?, dni=?, telefono=?, direccion=?, distrito=?, diagnostico=?, estado=?
        WHERE id = ? AND activo = 1
    ");
    $st->execute([
        trim($body['nombre']      ?? ''),
        $body['edad']             ?: null,
        $genero,
        $body['dni']              ?: null,
        $body['telefono']         ?: null,
        $body['direccion']        ?: null,
        $body['distrito']         ?: null,
        $body['diagnostico']      ?: null,
        $estado,
        $id,
    ]);
    ok();
}

// ── DELETE: desactivar paciente ───────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    $pdo->prepare("UPDATE pacientes SET activo = 0 WHERE id = ?")->execute([$id]);
    ok();
}

fail('Método no permitido.', 405);
