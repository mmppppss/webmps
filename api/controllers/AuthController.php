<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';

class AuthController
{
    /** Intentos maximos antes de bloquear. */
    private const MAX_ATTEMPTS = 5;

    /** Ventana de bloqueo en segundos (15 minutos). */
    private const LOCK_WINDOW = 900;

    private $userModel;

    public function __construct($db = null)
    {
        if ($db === null) {
            require_once __DIR__ . '/../config/database.php';
            $db = (new Database())->getConnection();
        }

        $this->userModel = new User($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login($username, $password)
    {
        if (empty($username) || empty($password)) {
            return ['status' => 'error', 'message' => 'Credenciales incompletas'];
        }

        if ($this->isLocked($username)) {
            return [
                'status' => 'error',
                'message' => 'Demasiados intentos fallidos. Espera 15 minutos.',
            ];
        }

        $user = $this->userModel->getByUsername($username);

        // password_verify se ejecuta siempre (aunque el usuario no exista) para
        // que el tiempo de respuesta no revele que cuentas existen.
        $hash = $user ? $user['password'] : '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

        if (!$user || !password_verify($password, $hash)) {
            $this->registerFailedAttempt($username);
            return ['status' => 'error', 'message' => 'Credenciales invalidas'];
        }

        // El hash puede estar desactualizado si PASSWORD_DEFAULT cambio.
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
            $this->userModel->updatePassword(
                (int) $user['id'],
                password_hash($password, PASSWORD_DEFAULT)
            );
        }

        // Regenera el ID de sesion: sin esto, un atacante que consiga fijar
        // un PHPSESSID antes del login conserva la sesion autenticada.
        session_regenerate_id(true);

        $this->clearAttempts($username);

        $_SESSION['authenticated'] = true;
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['rol'] = $user['rol'] ?? 'editor';

        return ['status' => 'success', 'message' => 'Logged in'];
    }

    public function register($username, $password)
    {
        if (!preg_match('/^[\w.\-@]{3,32}$/', (string) $username)) {
            return ['status' => 'error', 'message' => 'Usuario invalido (3-32 caracteres)'];
        }

        if (strlen((string) $password) < 8) {
            return ['status' => 'error', 'message' => 'La contrasena debe tener al menos 8 caracteres'];
        }

        if ($this->userModel->getByUsername($username)) {
            return ['status' => 'error', 'message' => 'El usuario ya existe'];
        }

        // El rol lo decide el servidor, nunca el cliente. Antes se dependia del
        // DEFAULT de la columna, que era 'admin': cualquier usuario creado
        // desde la API era administrador.
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        if ($this->userModel->create($username, $passwordHash, 'editor')) {
            return ['status' => 'success', 'message' => 'Usuario creado'];
        }

        return ['status' => 'error', 'message' => 'No se pudo crear el usuario'];
    }

    public function logout()
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        return ['status' => 'success', 'message' => 'Logged out'];
    }

    public function isAuthenticated()
    {
        return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
    }

    // ── Rate limiting por archivo, sin dependencias ────────────────────────
    // Nota: en hosting compartido el almacenamiento es local al servidor, asi
    // que esta proteccion depende de que no haya varias maquinas detras del LB.

    private function attemptsFile(): string
    {
        $dir = __DIR__ . '/../storage';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        // .htaccess en storage/ debe negar todo el acceso web
        return $dir . '/login_attempts.json';
    }

    private function readAttempts(): array
    {
        $file = $this->attemptsFile();
        if (!is_file($file)) {
            return [];
        }
        $raw = @file_get_contents($file);
        if ($raw === false || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    private function writeAttempts(array $data): void
    {
        @file_put_contents(
            $this->attemptsFile(),
            json_encode($data),
            LOCK_EX
        );
    }

    private function isLocked($username): bool
    {
        $attempts = $this->readAttempts();
        $key = strtolower((string) $username);

        if (!isset($attempts[$key])) {
            return false;
        }

        $entry = $attempts[$key];

        // Ventana expirada: se limpia sola
        if ((time() - (int) $entry['ts']) > self::LOCK_WINDOW) {
            unset($attempts[$key]);
            $this->writeAttempts($attempts);
            return false;
        }

        return (int) $entry['n'] >= self::MAX_ATTEMPTS;
    }

    private function registerFailedAttempt($username): void
    {
        $attempts = $this->readAttempts();
        $key = strtolower((string) $username);

        if (isset($attempts[$key]) && (time() - (int) $attempts[$key]['ts']) <= self::LOCK_WINDOW) {
            $attempts[$key]['n'] = (int) $attempts[$key]['n'] + 1;
        } else {
            $attempts[$key] = ['n' => 1, 'ts' => time()];
        }

        // Poda de entradas viejas para que el archivo no crezca sin limite
        foreach ($attempts as $k => $entry) {
            if ((time() - (int) $entry['ts']) > self::LOCK_WINDOW) {
                unset($attempts[$k]);
            }
        }

        $this->writeAttempts($attempts);
    }

    private function clearAttempts($username): void
    {
        $attempts = $this->readAttempts();
        unset($attempts[strtolower((string) $username)]);
        $this->writeAttempts($attempts);
    }
}