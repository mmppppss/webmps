<?php
declare(strict_types=1);

class Category
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $stmt = $this->db->query(
            "SELECT c.id, c.nombre, c.slug, COUNT(a.id) AS articulos
             FROM categorias c
             LEFT JOIN articulos a ON a.categoria = c.nombre
                                 AND a.status = 'publicado'
                                 AND a.deleted_at IS NULL
             GROUP BY c.id, c.nombre, c.slug
             ORDER BY c.nombre ASC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByName($nombre)
    {
        $stmt = $this->db->prepare("SELECT * FROM categorias WHERE nombre = :nombre LIMIT 1");
        $stmt->bindValue(':nombre', $nombre);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? false : $row;
    }

    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM categorias WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? false : $row;
    }

    /**
     * Devuelve el NOMBRE de la categoria, creandola si no existe.
     *
     * Se usa al crear/editar un articulo: si el panel envia una categoria
     * nueva, se registra sola y el select del panel queda sincronizado.
     *
     * Devuelve el nombre y no el id porque articulos.categoria es VARCHAR(50)
     * y guarda el texto, no la referencia.
     */
    public function ensure($nombre)
    {
        $nombre = trim((string) $nombre);
        if ($nombre === '') {
            return null;
        }

        // Se limita a 50 caracteres porque articulos.categoria es VARCHAR(50)
        $nombre = mb_substr($nombre, 0, 50);

        if ($this->findByName($nombre)) {
            return $nombre;
        }

        $result = $this->create($nombre);

        return isset($result['error']) ? null : $result['nombre'];
    }

    public function create($nombre)
    {
        $nombre = mb_substr(trim((string) $nombre), 0, 50);

        if ($nombre === '') {
            return ['error' => 'El nombre de la categoria no puede estar vacio'];
        }

        if ($this->findByName($nombre)) {
            return ['error' => 'Esa categoria ya existe'];
        }

        $slug = $this->uniqueSlug($nombre);

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO categorias (nombre, slug) VALUES (:nombre, :slug)"
            );
            $stmt->bindValue(':nombre', $nombre);
            $stmt->bindValue(':slug', $slug);
            $stmt->execute();

            return [
                'id'     => (int) $this->db->lastInsertId(),
                'nombre' => $nombre,
                'slug'   => $slug,
            ];
        } catch (PDOException $e) {
            // Nunca concatenar el objeto Exception a un string: es un fatal
            error_log('Category::create fallo: ' . $e->getMessage());
            return ['error' => 'No se pudo crear la categoria'];
        }
    }

    public function update($id, $nombre)
    {
        $id = (int) $id;

        $actual = $this->findById($id);
        if (!$actual) {
            return ['error' => 'La categoria no existe'];
        }

        $nombre = mb_substr(trim((string) $nombre), 0, 50);
        if ($nombre === '') {
            return ['error' => 'El nombre de la categoria no puede estar vacio'];
        }

        $duplicada = $this->findByName($nombre);
        if ($duplicada && (int) $duplicada['id'] !== $id) {
            return ['error' => 'Ya existe otra categoria con ese nombre'];
        }

        $stmt = $this->db->prepare(
            "UPDATE categorias SET nombre = :nombre, slug = :slug WHERE id = :id"
        );
        $stmt->bindValue(':nombre', $nombre);
        $stmt->bindValue(':slug', $this->uniqueSlug($nombre, $id));
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        // articulos.categoria guarda el nombre en texto plano, así que hay
        // que mantenerlo sincronizado o los artículos quedan huérfanos
        if ($actual['nombre'] !== $nombre) {
            $stmt = $this->db->prepare("UPDATE articulos SET categoria = :new WHERE categoria = :old");
            $stmt->bindValue(':new', $nombre);
            $stmt->bindValue(':old', $actual['nombre']);
            $stmt->execute();
        }

        return ['id' => $id, 'nombre' => $nombre];
    }

    public function delete($id)
    {
        $id = (int) $id;

        $actual = $this->findById($id);
        if (!$actual) {
            return ['error' => 'La categoria no existe'];
        }

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM articulos WHERE categoria = :nombre AND deleted_at IS NULL"
        );
        $stmt->bindValue(':nombre', $actual['nombre']);
        $stmt->execute();
        $total = (int) $stmt->fetchColumn();

        if ($total > 0) {
            return [
                'error' => 'No se puede eliminar: hay ' . $total
                    . ' articulo(s) en esta categoria. Muelelos o eliminalos primero.',
            ];
        }

        $stmt = $this->db->prepare("DELETE FROM categorias WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return ['id' => $id];
    }

    /**
     * Slug único. $excludeId se usa al renombrar, para no chocar consigo mismo.
     */
    private function uniqueSlug($nombre, $excludeId = null)
    {
        $base = $this->slugify($nombre);
        $slug = $base;
        $n    = 2;

        $sql = "SELECT COUNT(*) FROM categorias WHERE slug = :slug";
        if ($excludeId !== null) {
            $sql .= " AND id <> :id";
        }

        $stmt = $this->db->prepare($sql);

        while (true) {
            $stmt->bindValue(':slug', $slug);
            if ($excludeId !== null) {
                $stmt->bindValue(':id', (int) $excludeId, PDO::PARAM_INT);
            }
            $stmt->execute();

            if ((int) $stmt->fetchColumn() === 0) {
                return $slug;
            }
            $slug = $base . '-' . $n++;
        }
    }

    public function slugify($texto)
    {
        // Mismo criterio que Article::slugify(): sin depender de iconv(),
        // que puede no estar disponible según la instalación de PHP.
        $texto = strtr((string) $texto, array(
            'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a', 'å' => 'a',
            'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
            'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o', 'ø' => 'o',
            'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u',
            'ñ' => 'n', 'ç' => 'c', 'ß' => 'ss', 'ý' => 'y',
            'Á' => 'a', 'À' => 'a', 'Ä' => 'a', 'Â' => 'a', 'Ã' => 'a', 'Å' => 'a',
            'É' => 'e', 'È' => 'e', 'Ë' => 'e', 'Ê' => 'e',
            'Í' => 'i', 'Ì' => 'i', 'Ï' => 'i', 'Î' => 'i',
            'Ó' => 'o', 'Ò' => 'o', 'Ö' => 'o', 'Ô' => 'o', 'Õ' => 'o', 'Ø' => 'o',
            'Ú' => 'u', 'Ù' => 'u', 'Ü' => 'u', 'Û' => 'u',
            'Ñ' => 'n', 'Ç' => 'c', 'Ý' => 'y',
        ));

        $texto = preg_replace('/[^a-zA-Z0-9]+/', '-', $texto);
        $texto = trim(strtolower((string) $texto), '-');

        return $texto !== '' ? $texto : 'categoria';
    }
}