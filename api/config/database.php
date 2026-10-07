<?php
declare(strict_types=1);

/**
 * Conexión a la base de datos.
 *
 * Antes `loadenv()` estaba definida en este archivo y `die()` con el mensaje
 * "Conexion fallida: ..." si algo fallaba, que en la API devolvía HTML dentro
 * de una respuesta que declara Content-Type: application/json.
 */

final class Database
{
    private static $instance = null;
    private $conn;

    public function __construct()
    {
        if (self::$instance !== null) {
            $this->conn = self::$instance;
            return;
        }

        $env = self::loadEnv(__DIR__ . '/../.env');

        $host    = $env['DB_HOST']     ?? '';
        $dbname  = $env['DB_DATABASE'] ?? '';
        $user    = $env['DB_USERNAME'] ?? '';
        $pass    = $env['DB_PASSWORD'] ?? '';
        $charset = $env['DB_CHARSET'] ?? 'utf8mb4';

        if ($host === '' || $dbname === '') {
            throw new RuntimeException('Faltan las credenciales de la base de datos en api/.env');
        }

        $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

        try {
            $this->conn = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
        } catch (PDOException $e) {
            // El detalle va al log, nunca a la respuesta: el mensaje de
            // PDOException incluye usuario, host y motivo del rechazo.
            error_log('Database: fallo de conexion - ' . $e->getMessage());
            throw new RuntimeException('No se pudo conectar con la base de datos', 0, $e);
        }

        self::$instance = $this->conn;
    }

    public function getConnection()
    {
        return $this->conn;
    }

    /**
     * Lector de .env sin dependencias externas.
     * - Ignora líneas en blanco y comentarios
     * - No sobrescribe variables ya definidas en el entorno real
     * - Admite comillas simples y dobles
     */
    public static function loadEnv(string $file): array
    {
        if (!is_file($file)) {
            return [];
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return [];
        }

        $parsed = [];

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }

            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            if ($key === '') {
                continue;
            }

            // quita comillas envolventes
            if (strlen($value) > 1) {
                $first = $value[0];
                $last = substr($value, -1);
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            $parsed[$key] = $value;
            $_ENV[$key] = $value;

            if (getenv($key) === false) {
                putenv("$key=$value");
            }
        }

        return $parsed;
    }
}