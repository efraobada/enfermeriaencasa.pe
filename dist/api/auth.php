<?php
$_origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$_allowed = ['https://enfermeriaencasa.net', 'https://www.enfermeriaencasa.net', 'http://localhost:5173'];
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowed) ? $_origin : 'https://enfermeriaencasa.net'));
header('Vary: Origin');
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Staff-Token");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$cfg = require __DIR__ . '/db.php';
try {
    $dsn = "mysql:host={$cfg['host']};dbname={$cfg['db']};charset={$cfg['charset']}";
    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'message' => 'Error de conexión a la base de datos.']);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? '';

function ok(array $data = [])  { echo json_encode(['ok' => true] + $data); exit; }
function fail(string $msg)     { echo json_encode(['ok' => false, 'message' => $msg]); exit; }

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

function getPersonalByToken(PDO $pdo): ?array {
    $token = readToken();
    if (!$token) return null;
    $st = $pdo->prepare("
        SELECT p.id, p.nombre, p.username, p.rol
        FROM sesiones s
        JOIN personal p ON p.id = s.personal_id
        WHERE s.token = ? AND s.expira_en > NOW() AND p.activo = 1
    ");
    $st->execute([$token]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
}

// ── Login ─────────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');
    if (!$username || !$password) fail('Usuario y contraseña son requeridos.');

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip = trim(explode(',', $ip)[0]);

    // Limpiar intentos viejos (más de 15 minutos)
    $pdo->prepare("DELETE FROM intentos_login WHERE ultimo_intento < DATE_SUB(NOW(), INTERVAL 15 MINUTE)")->execute();

    // Verificar bloqueo
    $bl = $pdo->prepare("SELECT intentos, bloqueado_hasta FROM intentos_login WHERE ip = ? AND username = ?");
    $bl->execute([$ip, $username]);
    $intento = $bl->fetch(PDO::FETCH_ASSOC);

    if ($intento && $intento['bloqueado_hasta'] && $intento['bloqueado_hasta'] > date('Y-m-d H:i:s')) {
        $resta = ceil((strtotime($intento['bloqueado_hasta']) - time()) / 60);
        fail("Demasiados intentos fallidos. Intente de nuevo en {$resta} minuto(s).");
    }

    $st = $pdo->prepare("SELECT * FROM personal WHERE username = ? AND activo = 1");
    $st->execute([$username]);
    $user = $st->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        // Registrar intento fallido
        $intentos = ($intento['intentos'] ?? 0) + 1;
        $bloqueo  = $intentos >= 5 ? date('Y-m-d H:i:s', strtotime('+15 minutes')) : null;
        if ($intento) {
            $pdo->prepare("UPDATE intentos_login SET intentos=?, bloqueado_hasta=? WHERE ip=? AND username=?")
                ->execute([$intentos, $bloqueo, $ip, $username]);
        } else {
            $pdo->prepare("INSERT INTO intentos_login (ip, username, intentos, bloqueado_hasta) VALUES (?,?,?,?)")
                ->execute([$ip, $username, $intentos, $bloqueo]);
        }
        $restantes = max(0, 5 - $intentos);
        $msg = $restantes > 0 ? "Credenciales incorrectas. ({$restantes} intento(s) restante(s))" : 'Cuenta bloqueada 15 minutos por múltiples intentos fallidos.';
        fail($msg);
    }

    // Login exitoso: limpiar intentos
    $pdo->prepare("DELETE FROM intentos_login WHERE ip = ? AND username = ?")->execute([$ip, $username]);
    $pdo->prepare("DELETE FROM sesiones WHERE personal_id = ? OR expira_en < NOW()")->execute([$user['id']]);

    $token  = bin2hex(random_bytes(32));
    $expira = date('Y-m-d H:i:s', strtotime('+12 hours'));
    $pdo->prepare("INSERT INTO sesiones (personal_id, token, expira_en) VALUES (?, ?, ?)")
        ->execute([$user['id'], $token, $expira]);

    ok([
        'token' => $token,
        'user'  => ['id' => $user['id'], 'nombre' => $user['nombre'], 'username' => $user['username'], 'rol' => $user['rol']],
    ]);
}

// ── Validate ──────────────────────────────────────────────────────────────────
if ($action === 'validate') {
    $user = getPersonalByToken($pdo);
    if (!$user) fail('Token inválido o expirado.');
    ok(['user' => $user]);
}

// ── Logout ────────────────────────────────────────────────────────────────────
if ($action === 'logout') {
    $token = readToken();
    if ($token) $pdo->prepare("DELETE FROM sesiones WHERE token = ?")->execute([$token]);
    ok();
}

// ── Cambiar contraseña ────────────────────────────────────────────────────────
if ($action === 'change_password') {
    $user = getPersonalByToken($pdo);
    if (!$user) fail('No autenticado.');
    $current = $body['current'] ?? '';
    $nuevo   = $body['nuevo']   ?? '';
    if (strlen($nuevo) < 8) fail('La nueva contraseña debe tener al menos 8 caracteres.');
    $st = $pdo->prepare("SELECT password FROM personal WHERE id = ?");
    $st->execute([$user['id']]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row || !password_verify($current, $row['password'])) fail('Contraseña actual incorrecta.');
    $pdo->prepare("UPDATE personal SET password = ? WHERE id = ?")->execute([password_hash($nuevo, PASSWORD_DEFAULT), $user['id']]);
    // Invalidar todas las sesiones del usuario para forzar re-login con nueva contraseña
    $pdo->prepare("DELETE FROM sesiones WHERE personal_id = ?")->execute([$user['id']]);
    ok();
}

fail('Acción no reconocida.');
