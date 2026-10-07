<?php
declare(strict_types=1);

class User
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Datos para el login. Incluye el hash porque AuthController necesita
     * compararlo con password_verify; los demás métodos no lo exponen.
     */
    public function getByUsername($username)
    {
        $query = "SELECT id, username, password, rol, activo
                  FROM users
                  WHERE username = :username AND activo = 1
                  LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':username', $username);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row === false ? false : $row;
    }

    /** Datos públicos: sin hash. */
    public function getById($id)
    {
        $stmt = $this->db->prepare(
            "SELECT id, username, rol, activo, created_at, updated_at
             FROM users WHERE id = :id LIMIT 1"
        );
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row === false ? false : $row;
    }

    public function create($username, $passwordHash, $rol = 'editor')
    {
        // El rol lo fija el servidor. Antes se omitía y la columna default
        // era 'admin', con lo que cualquier usuario creado por la API
        // nacía administrador.
        $query = "INSERT INTO users (username, password, rol)
                  VALUES (:username, :password, :rol)";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':username', $username);
        $stmt->bindValue(':password', $passwordHash);
        $stmt->bindValue(':rol', $rol);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('User::create fallo: ' . $e->getMessage());
            return false;
        }
    }

    public function updatePassword($id, $passwordHash)
    {
        $stmt = $this->db->prepare("UPDATE users SET password = :password WHERE id = :id");
        $stmt->bindValue(':password', $passwordHash);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function updateRol($id, $rol)
    {
        if (!in_array($rol, ['admin', 'editor'], true)) {
            return false;
        }

        $stmt = $this->db->prepare("UPDATE users SET rol = :rol WHERE id = :id");
        $stmt->bindValue(':rol', $rol);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}