<?php

/**
 * Función para cargar las variables de entorno desde un archivo .env
 *
 * @param string $file_path Ruta al archivo .env
 */
function loadenv($file_path)
{
    if (!file_exists($file_path)) {
        die("Archivo .env no encontrado en la ruta especificada.");
    }
    $lines = file($file_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $_ENV[$key] = $value;
    }
}


class Database {
	private $conn;

    public function __construct() {
		loadenv(__DIR__ . '/../.env');  
        $servername = $_ENV['DB_HOST'];
        $username = $_ENV['DB_USERNAME'];
        $password = $_ENV['DB_PASSWORD'];
        $dbname = $_ENV['DB_DATABASE'];
        $charset = "utf8mb4";

        try {
            $dsn = "mysql:host=$servername;dbname=$dbname;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
			$this->conn = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            die("Conexión fallida: " . $e->getMessage());
        }
	}

    public function getConnection() {
        return $this->conn;
    }
}
?>
