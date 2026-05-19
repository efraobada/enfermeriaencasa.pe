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

// ── GET: turnos del mes + quién está de turno ahora ──────────────────────────
if ($method === 'GET') {
    // Mes solicitado en formato YYYY-MM
    $mes   = $_GET['mes'] ?? date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $mes)) $mes = date('Y-m');
    $desde = $mes . '-01';
    $hasta = date('Y-m-t', strtotime($desde)); // último día del mes

    $st = $pdo->prepare("
        SELECT t.id, t.personal_id, t.fecha, t.hora_inicio, t.hora_fin, t.notas,
               p.nombre AS personal_nombre, p.rol AS personal_rol
        FROM turnos t
        JOIN personal p ON p.id = t.personal_id
        WHERE t.fecha BETWEEN ? AND ?
        ORDER BY t.fecha ASC, t.hora_inicio ASC
    ");
    $st->execute([$desde, $hasta]);
    $turnos = $st->fetchAll(PDO::FETCH_ASSOC);

    // Quién está de turno AHORA mismo
    $ahora = $pdo->query("
        SELECT t.id, p.id AS personal_id, p.nombre, p.rol, t.hora_inicio, t.hora_fin, t.notas
        FROM turnos t
        JOIN personal p ON p.id = t.personal_id
        WHERE t.fecha = CURDATE()
          AND t.hora_inicio <= CURTIME()
          AND t.hora_fin    >= CURTIME()
          AND p.activo = 1
        ORDER BY t.hora_inicio ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Lista de personal activo para el selector
    $personal = $pdo->query("
        SELECT id, nombre, rol FROM personal WHERE activo = 1 ORDER BY nombre ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    ok(['turnos' => $turnos, 'ahora' => $ahora, 'personal' => $personal, 'mes' => $mes, 'desde' => $desde, 'hasta' => $hasta]);
}

// ── POST: crear turno (solo admin) ───────────────────────────────────────────
if ($method === 'POST') {
    if ($user['rol'] !== 'admin') fail('Solo administradores pueden asignar turnos.', 403);

    $personalId  = intval($body['personal_id'] ?? 0);
    $fecha       = trim($body['fecha']       ?? '');
    $horaInicio  = trim($body['hora_inicio'] ?? '');
    $horaFin     = trim($body['hora_fin']    ?? '');
    $notas       = trim($body['notas']       ?? '');

    if (!$personalId) fail('Seleccione un personal.');
    if (!$fecha || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) fail('Fecha inválida.');
    if (!$horaInicio || !$horaFin) fail('Hora de inicio y fin son requeridas.');
    if ($horaInicio >= $horaFin) fail('La hora de fin debe ser mayor que la de inicio.');

    $st = $pdo->prepare("
        INSERT INTO turnos (personal_id, fecha, hora_inicio, hora_fin, notas)
        VALUES (?, ?, ?, ?, ?)
    ");
    $st->execute([$personalId, $fecha, $horaInicio, $horaFin, $notas ?: null]);
    $id = $pdo->lastInsertId();

    $st = $pdo->prepare("
        SELECT t.*, p.nombre AS personal_nombre, p.rol AS personal_rol
        FROM turnos t JOIN personal p ON p.id = t.personal_id
        WHERE t.id = ?
    ");
    $st->execute([$id]);
    ok(['turno' => $st->fetch(PDO::FETCH_ASSOC)]);
}

// ── PUT: editar turno (solo admin) ───────────────────────────────────────────
if ($method === 'PUT') {
    if ($user['rol'] !== 'admin') fail('Solo administradores.', 403);

    $id         = intval($body['id'] ?? 0);
    $horaInicio = trim($body['hora_inicio'] ?? '');
    $horaFin    = trim($body['hora_fin']    ?? '');
    $notas      = trim($body['notas']       ?? '');

    if (!$id) fail('ID requerido.');
    if (!$horaInicio || !$horaFin) fail('Hora de inicio y fin son requeridas.');
    if ($horaInicio >= $horaFin) fail('La hora de fin debe ser mayor que la de inicio.');

    $pdo->prepare("UPDATE turnos SET hora_inicio=?, hora_fin=?, notas=? WHERE id=?")
        ->execute([$horaInicio, $horaFin, $notas ?: null, $id]);
    ok();
}

// ── DELETE: eliminar turno (solo admin) ──────────────────────────────────────
if ($method === 'DELETE') {
    if ($user['rol'] !== 'admin') fail('Solo administradores.', 403);
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    $pdo->prepare("DELETE FROM turnos WHERE id = ?")->execute([$id]);
    ok();
}

fail('Método no permitido.', 405);
