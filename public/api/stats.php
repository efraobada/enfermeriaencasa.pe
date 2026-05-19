<?php
$_origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$_allowed = ['https://enfermeriaencasa.net', 'https://www.enfermeriaencasa.net', 'http://localhost:5173'];
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowed) ? $_origin : 'https://enfermeriaencasa.net'));
header('Vary: Origin');
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
if ($user['rol'] !== 'admin') fail('Solo administradores.', 403);

// ── Totales generales ─────────────────────────────────────────────────────────
$totPacientes  = $pdo->query("SELECT COUNT(*) FROM pacientes WHERE activo = 1")->fetchColumn();
$totAtenciones = $pdo->query("SELECT COUNT(*) FROM signos_vitales WHERE eliminado = 0")->fetchColumn();
$totPersonal   = $pdo->query("SELECT COUNT(*) FROM personal WHERE activo = 1")->fetchColumn();

// Atenciones hoy
$hoy = $pdo->query("SELECT COUNT(*) FROM signos_vitales WHERE DATE(registrado_en) = CURDATE() AND eliminado = 0")->fetchColumn();

// Atenciones esta semana (lunes a hoy)
$semana = $pdo->query("SELECT COUNT(*) FROM signos_vitales WHERE registrado_en >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND eliminado = 0")->fetchColumn();

// Atenciones este mes
$mes = $pdo->query("SELECT COUNT(*) FROM signos_vitales WHERE YEAR(registrado_en)=YEAR(NOW()) AND MONTH(registrado_en)=MONTH(NOW()) AND eliminado = 0")->fetchColumn();

// ── Por tipo de atención ──────────────────────────────────────────────────────
$stTipo = $pdo->query("
    SELECT
        COALESCE(tipo_atencion, 'Sin especificar') AS tipo,
        COUNT(*) AS total
    FROM signos_vitales
    WHERE eliminado = 0
    GROUP BY tipo_atencion
    ORDER BY total DESC
");
$porTipo = $stTipo->fetchAll(PDO::FETCH_ASSOC);

// ── Por personal ──────────────────────────────────────────────────────────────
$stPersonal = $pdo->query("
    SELECT p.nombre, p.rol, COUNT(sv.id) AS total,
           MAX(sv.registrado_en) AS ultima_atencion
    FROM personal p
    LEFT JOIN signos_vitales sv ON sv.personal_id = p.id
    WHERE p.activo = 1
    GROUP BY p.id, p.nombre, p.rol
    ORDER BY total DESC
");
$porPersonal = $stPersonal->fetchAll(PDO::FETCH_ASSOC);

// ── Últimas 30 atenciones (actividad reciente) ─────────────────────────────────
$stRecientes = $pdo->query("
    SELECT sv.id, sv.registrado_en, sv.tipo_atencion,
           pac.nombre AS paciente, per.nombre AS personal
    FROM signos_vitales sv
    JOIN pacientes pac ON pac.id = sv.paciente_id
    JOIN personal per  ON per.id = sv.personal_id
    WHERE sv.eliminado = 0
    ORDER BY sv.registrado_en DESC
    LIMIT 15
");
$recientes = $stRecientes->fetchAll(PDO::FETCH_ASSOC);

// ── Atenciones por día (últimos 14 días) ──────────────────────────────────────
$stDias = $pdo->query("
    SELECT DATE(registrado_en) AS dia, COUNT(*) AS total
    FROM signos_vitales
    WHERE registrado_en >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND eliminado = 0
    GROUP BY DATE(registrado_en)
    ORDER BY dia ASC
");
$porDia = $stDias->fetchAll(PDO::FETCH_ASSOC);

ok([
    'resumen' => [
        'pacientes'   => (int)$totPacientes,
        'atenciones'  => (int)$totAtenciones,
        'personal'    => (int)$totPersonal,
        'hoy'         => (int)$hoy,
        'semana'      => (int)$semana,
        'mes'         => (int)$mes,
    ],
    'por_tipo'     => $porTipo,
    'por_personal' => $porPersonal,
    'recientes'    => $recientes,
    'por_dia'      => $porDia,
]);
