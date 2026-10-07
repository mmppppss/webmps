<?php
declare(strict_types=1);

/**
 * Punto de entrada de la API.
 * La API vive en el mismo dominio que el sitio y el panel, asi que el CORS
 * solo hace falta para desarrollo local. Nunca se envia '*' porque las
 * peticiones del panel viajan con credenciales (cookies de sesion).
 */

// parse_ini_file() no se usa aquí: rompe con los comentarios del .env que
// contienen paréntesis o dos puntos. Database::loadEnv() los ignora.
require_once __DIR__ . '/../config/database.php';
$dotenv = Database::loadEnv(__DIR__ . '/../.env');

// ── CORS: solo si el origen esta en la lista blanca ────────────────────────
$origenes = array_filter(array_map('trim', explode(
    ',',
    (string) ($dotenv['API_ALLOWED_ORIGINS'] ?? '')
)));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $origenes, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

// ── Sesion endurecida ──────────────────────────────────────────────────────
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

// secure solo en HTTPS: si lo activamos en HTTP plano, la cookie nunca viaja
// y el panel deja de poder iniciar sesion.
session_set_cookie_params(0, '/', '', $https, true);

// Solo PHP >= 7.3 honors esto. En 7.2 se ignora en silencio, pero los
// navegadores modernos aplican Lax por defecto.
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_maxlifetime', '7200');

session_name('webmps_sess'); // no regalar el nombre "PHPSESSID"
session_start();

require_once __DIR__ . '/../routes/web.php';