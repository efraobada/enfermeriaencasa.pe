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

function ok(array $data = [])  { echo json_encode(['ok' => true] + $data); exit; }
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
function requireAdmin(PDO $pdo): array {
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
    if ($user['rol'] !== 'admin') fail('Solo administradores pueden acceder.', 403);
    return $user;
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$admin  = requireAdmin($pdo);

// ── GET: listar personal ──────────────────────────────────────────────────────
if ($method === 'GET') {
    $st = $pdo->prepare("
        SELECT id, nombre, username, rol, activo, creado_en
        FROM personal
        ORDER BY rol ASC, nombre ASC
    ");
    $st->execute();
    ok(['items' => $st->fetchAll(PDO::FETCH_ASSOC)]);
}

// ── POST: crear personal ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $nombre   = trim($body['nombre']   ?? '');
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');
    $rol      = in_array($body['rol'] ?? '', ['admin', 'enfermera']) ? $body['rol'] : 'enfermera';

    if (!$nombre)   fail('El nombre es requerido.');
    if (!$username) fail('El usuario es requerido.');
    if (!preg_match('/^[a-z0-9._-]{3,30}$/i', $username)) fail('Usuario inválido (3-30 caracteres, solo letras, números, punto, guión).');
    if (strlen($password) < 8) fail('La contraseña debe tener al menos 8 caracteres.');

    $chk = $pdo->prepare("SELECT id FROM personal WHERE username = ?");
    $chk->execute([$username]);
    if ($chk->fetch()) fail('Ese nombre de usuario ya está en uso.');

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $st = $pdo->prepare("INSERT INTO personal (nombre, username, password, rol) VALUES (?, ?, ?, ?)");
    $st->execute([$nombre, $username, $hash, $rol]);
    $id = $pdo->lastInsertId();

    $st = $pdo->prepare("SELECT id, nombre, username, rol, activo, creado_en FROM personal WHERE id = ?");
    $st->execute([$id]);
    ok(['member' => $st->fetch(PDO::FETCH_ASSOC)]);
}

// ── PUT: actualizar personal (nombre, rol, activo) ────────────────────────────
if ($method === 'PUT') {
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    if ($id === $admin['id']) fail('No puedes modificar tu propia cuenta desde aquí.');

    $fields = [];
    $params = [];

    if (isset($body['nombre']) && trim($body['nombre'])) {
        $fields[] = 'nombre = ?'; $params[] = trim($body['nombre']);
    }
    if (isset($body['username']) && trim($body['username'])) {
        $u = trim($body['username']);
        if (!preg_match('/^[a-z0-9._-]{3,30}$/i', $u)) fail('Usuario inválido.');
        $chk = $pdo->prepare("SELECT id FROM personal WHERE username = ? AND id != ?");
        $chk->execute([$u, $id]);
        if ($chk->fetch()) fail('Ese nombre de usuario ya está en uso.');
        $fields[] = 'username = ?'; $params[] = $u;
    }
    if (isset($body['rol']) && in_array($body['rol'], ['admin', 'enfermera'])) {
        $fields[] = 'rol = ?'; $params[] = $body['rol'];
    }
    if (isset($body['activo'])) {
        $fields[] = 'activo = ?'; $params[] = $body['activo'] ? 1 : 0;
    }
    if (isset($body['password']) && strlen($body['password']) >= 8) {
        $fields[] = 'password = ?'; $params[] = password_hash($body['password'], PASSWORD_DEFAULT);
    }

    if (!$fields) fail('Nada que actualizar.');
    $params[] = $id;
    $pdo->prepare("UPDATE personal SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    ok();
}

// ── DELETE: eliminar personal ─────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    if ($id === $admin['id']) fail('No puedes eliminar tu propia cuenta.');
    $pdo->prepare("DELETE FROM sesiones WHERE personal_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM personal WHERE id = ?")->execute([$id]);
    ok();
}

fail('Método no permitido.', 405);
