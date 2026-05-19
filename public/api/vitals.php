<?php
$_origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$_allowed = ['https://enfermeriaencasa.net', 'https://www.enfermeriaencasa.net', 'http://localhost:5173'];
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowed) ? $_origin : 'https://enfermeriaencasa.net'));
header('Vary: Origin');
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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

// ── GET: historial de signos vitales de un paciente ───────────────────────────
if ($method === 'GET') {
    $pacienteId = intval($_GET['patient_id'] ?? 0);
    if (!$pacienteId) fail('patient_id requerido.');
    $st = $pdo->prepare("
        SELECT v.*, p.nombre AS registrado_por
        FROM signos_vitales v
        JOIN personal p ON p.id = v.personal_id
        WHERE v.paciente_id = ? AND v.eliminado = 0
        ORDER BY v.registrado_en DESC
        LIMIT 100
    ");
    $st->execute([$pacienteId]);
    ok(['items' => $st->fetchAll(PDO::FETCH_ASSOC)]);
}

// ── POST: registrar signos vitales ────────────────────────────────────────────
if ($method === 'POST') {
    $pacienteId = intval($body['patient_id'] ?? 0);
    if (!$pacienteId) fail('patient_id requerido.');

    $sistolica  = isset($body['presion_sistolica'])  && $body['presion_sistolica']  !== '' ? intval($body['presion_sistolica'])  : null;
    $diastolica = isset($body['presion_diastolica']) && $body['presion_diastolica'] !== '' ? intval($body['presion_diastolica']) : null;
    $temp       = isset($body['temperatura'])        && $body['temperatura']        !== '' ? floatval($body['temperatura'])      : null;
    $sat        = isset($body['saturacion'])         && $body['saturacion']         !== '' ? intval($body['saturacion'])         : null;
    $meds       = trim($body['medicamentos']    ?? '');
    $obs        = trim($body['observaciones']   ?? '');
    $regAt      = trim($body['registered_at']   ?? '');
    $tipoAten   = trim($body['tipo_atencion']   ?? '');

    // Validación de rangos clínicos
    if ($sistolica  !== null && ($sistolica  < 30  || $sistolica  > 300)) fail('Presión sistólica fuera de rango clínico (30-300 mmHg).');
    if ($diastolica !== null && ($diastolica < 10  || $diastolica > 200)) fail('Presión diastólica fuera de rango clínico (10-200 mmHg).');
    if ($temp       !== null && ($temp       < 32.0 || $temp      > 43.0)) fail('Temperatura fuera de rango clínico (32-43 °C).');
    if ($sat        !== null && ($sat        < 50  || $sat        > 100)) fail('Saturación fuera de rango clínico (50-100 %).');

    $tiposValidos = [
        'Aplicación de Inyecciones a Domicilio',
        'Sueros Vitamínicos e Hidratación',
        'Curación Profesional de Heridas',
        'Cuidado del Adulto Mayor',
        'Atención Postoperatoria',
        'Suero para Mal de Altura (Soroche)',
        'Visita Domiciliaria',
    ];
    if ($tipoAten && !in_array($tipoAten, $tiposValidos)) $tipoAten = '';

    if ($regAt && !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $regAt)) {
        $regAt = '';
    }

    if (!$sistolica && !$diastolica && $temp === null && $sat === null && !$meds) {
        fail('Ingrese al menos un signo vital o medicamentos.');
    }

    if ($regAt) {
        $st = $pdo->prepare("
            INSERT INTO signos_vitales
                (paciente_id, personal_id, presion_sistolica, presion_diastolica, temperatura, saturacion, medicamentos, observaciones, tipo_atencion, registrado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $st->execute([$pacienteId, $user['id'], $sistolica, $diastolica, $temp, $sat, $meds ?: null, $obs ?: null, $tipoAten ?: null, $regAt]);
    } else {
        $st = $pdo->prepare("
            INSERT INTO signos_vitales
                (paciente_id, personal_id, presion_sistolica, presion_diastolica, temperatura, saturacion, medicamentos, observaciones, tipo_atencion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $st->execute([$pacienteId, $user['id'], $sistolica, $diastolica, $temp, $sat, $meds ?: null, $obs ?: null, $tipoAten ?: null]);
    }
    $id = $pdo->lastInsertId();

    $st = $pdo->prepare("
        SELECT v.*, p.nombre AS registrado_por
        FROM signos_vitales v JOIN personal p ON p.id = v.personal_id
        WHERE v.id = ?
    ");
    $st->execute([$id]);
    ok(['item' => $st->fetch(PDO::FETCH_ASSOC)]);
}

// ── DELETE: soft-delete (solo admin) ─────────────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($body['id'] ?? 0);
    if (!$id) fail('ID requerido.');
    if ($user['rol'] !== 'admin') fail('Solo administradores pueden eliminar registros.', 403);
    $pdo->prepare("UPDATE signos_vitales SET eliminado = 1 WHERE id = ?")->execute([$id]);
    ok();
}

fail('Método no permitido.', 405);
