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

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    // Por paciente
    if (!empty($_GET['paciente_id'])) {
        $pid = intval($_GET['paciente_id']);
        $st = $pdo->prepare("
            SELECT c.*, p.nombre AS personal_nombre, pac.nombre AS paciente_nombre
            FROM cobros c
            JOIN personal p  ON p.id  = c.personal_id
            JOIN pacientes pac ON pac.id = c.paciente_id
            WHERE c.paciente_id = ? AND c.eliminado = 0
            ORDER BY c.registrado_en DESC
        ");
        $st->execute([$pid]);
        ok(['items' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // Panel de caja: resumen + listado con filtros
    $desde = $_GET['desde'] ?? date('Y-m-01');
    $hasta = $_GET['hasta'] ?? date('Y-m-d');

    // Totales del período
    $totales = $pdo->prepare("
        SELECT
            COUNT(*)                                               AS total_cobros,
            COALESCE(SUM(monto),0)                                AS monto_total,
            COALESCE(SUM(CASE WHEN estado='pagado'    THEN monto ELSE 0 END),0) AS monto_pagado,
            COALESCE(SUM(CASE WHEN estado='pendiente' THEN monto ELSE 0 END),0) AS monto_pendiente,
            COALESCE(SUM(CASE WHEN estado='cancelado' THEN monto ELSE 0 END),0) AS monto_cancelado
        FROM cobros
        WHERE DATE(registrado_en) BETWEEN ? AND ? AND eliminado = 0
    ");
    $totales->execute([$desde, $hasta]);
    $resumen = $totales->fetch(PDO::FETCH_ASSOC);

    // Totales hoy
    $hoy = $pdo->query("
        SELECT COALESCE(SUM(monto),0) AS total,
               COALESCE(SUM(CASE WHEN estado='pagado' THEN monto ELSE 0 END),0) AS pagado
        FROM cobros WHERE DATE(registrado_en) = CURDATE() AND eliminado = 0
    ")->fetch(PDO::FETCH_ASSOC);

    // Por método de pago
    $porMetodo = $pdo->prepare("
        SELECT metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(monto),0) AS total
        FROM cobros
        WHERE DATE(registrado_en) BETWEEN ? AND ? AND estado = 'pagado' AND eliminado = 0
        GROUP BY metodo_pago ORDER BY total DESC
    ");
    $porMetodo->execute([$desde, $hasta]);

    // Listado detallado
    $estado = $_GET['estado'] ?? '';
    $estadoSQL = $estado ? "AND c.estado = :estado" : "";
    $st = $pdo->prepare("
        SELECT c.*, p.nombre AS personal_nombre, pac.nombre AS paciente_nombre
        FROM cobros c
        JOIN personal p    ON p.id  = c.personal_id
        JOIN pacientes pac ON pac.id = c.paciente_id
        WHERE DATE(c.registrado_en) BETWEEN :desde AND :hasta
          AND c.eliminado = 0
          $estadoSQL
        ORDER BY c.registrado_en DESC
        LIMIT 200
    ");
    $params = [':desde' => $desde, ':hasta' => $hasta];
    if ($estado) $params[':estado'] = $estado;
    $st->execute($params);

    ok([
        'resumen'    => $resumen,
        'hoy'        => $hoy,
        'por_metodo' => $porMetodo->fetchAll(PDO::FETCH_ASSOC),
        'items'      => $st->fetchAll(PDO::FETCH_ASSOC),
        'desde'      => $desde,
        'hasta'      => $hasta,
    ]);
}

// ── POST: registrar cobro ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $pacienteId  = intval($body['paciente_id'] ?? 0);
    $monto       = floatval($body['monto'] ?? 0);
    $metodo      = in_array($body['metodo_pago'] ?? '', ['efectivo','transferencia','yape','plin','otro'])
                   ? $body['metodo_pago'] : 'efectivo';
    $estado      = in_array($body['estado'] ?? '', ['pagado','pendiente','cancelado'])
                   ? $body['estado'] : 'pendiente';
    $tipoAtencion = trim($body['tipo_atencion'] ?? '');
    $notas        = trim($body['notas'] ?? '');

    if (!$pacienteId) fail('Paciente requerido.');
    if ($monto <= 0)  fail('El monto debe ser mayor a cero.');

    $st = $pdo->prepare("
        INSERT INTO cobros (paciente_id, personal_id, tipo_atencion, monto, metodo_pago, estado, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $st->execute([$pacienteId, $user['id'], $tipoAtencion ?: null, $monto, $metodo, $estado, $notas ?: null]);
    $id = $pdo->lastInsertId();

    $st = $pdo->prepare("
        SELECT c.*, p.nombre AS personal_nombre, pac.nombre AS paciente_nombre
        FROM cobros c
        JOIN personal p    ON p.id  = c.personal_id
        JOIN pacientes pac ON pac.id = c.paciente_id
        WHERE c.id = ?
    ");
    $st->execute([$id]);
    ok(['cobro' => $st->fetch(PDO::FETCH_ASSOC)]);
}

// ── PUT: actualizar estado o datos ────────────────────────────────────────────
if ($method === 'PUT') {
    $id     = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');

    $fields = []; $params = [];
    if (isset($body['estado']) && in_array($body['estado'], ['pagado','pendiente','cancelado'])) {
        $fields[] = 'estado = ?'; $params[] = $body['estado'];
    }
    if (isset($body['monto']) && floatval($body['monto']) > 0) {
        $fields[] = 'monto = ?'; $params[] = floatval($body['monto']);
    }
    if (isset($body['metodo_pago']) && in_array($body['metodo_pago'], ['efectivo','transferencia','yape','plin','otro'])) {
        $fields[] = 'metodo_pago = ?'; $params[] = $body['metodo_pago'];
    }
    if (isset($body['notas'])) {
        $fields[] = 'notas = ?'; $params[] = trim($body['notas']) ?: null;
    }
    if (!$fields) fail('Nada que actualizar.');
    $params[] = $id;
    $pdo->prepare("UPDATE cobros SET " . implode(', ', $fields) . " WHERE id = ? AND eliminado = 0")->execute($params);
    ok();
}

// ── DELETE: solo admin, soft-delete ──────────────────────────────────────────
if ($method === 'DELETE') {
    if ($user['rol'] !== 'admin') fail('Solo administradores pueden eliminar cobros.', 403);
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    $pdo->prepare("UPDATE cobros SET eliminado = 1 WHERE id = ?")->execute([$id]);
    ok();
}

fail('Método no permitido.', 405);
