<?php
declare(strict_types=1);

class Ad
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $query = "SELECT * FROM anuncios
                  ORDER BY activo DESC, prioridad ASC, fecha_inicio DESC";
        $stmt = $this->db->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve la fila del anuncio, o false si no existe.
     * El nombre `getById` sugiere que devuelve la fila: lo devuelve.
     * Para comprobar existencia, usar `exists()`.
     */
    public function getById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM anuncios WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row === false ? false : $row;
    }

    public function exists($id)
    {
        $stmt = $this->db->prepare("SELECT 1 FROM anuncios WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();

        return (bool) $stmt->fetchColumn();
    }

    /**
     * Anuncios que deben servirse en una posicion concreta.
     * Un SELECT normal con indice compuesto: es la consulta mas frecuente
     * del sitio publico.
     */
    public function getActiveByPosition($position)
    {
        $query = "SELECT * FROM anuncios
                  WHERE activo = 1
                    AND ubicacion = :position
                    AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
                    AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
                  ORDER BY prioridad ASC, RAND()";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':position', $position);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Aleatorio sin ORDER BY RAND() a nivel de tabla.
     * La tecnica es elegir un id aleatorio dentro del rango de ids validos y
     * buscar a partir de ahi. Con pocos anuncios el resultado es
     * estadisticamente equivalente y evita un sort completo por consulta.
     */
    private function randomWhere(array $params)
    {
        $where = [
            'activo = 1',
            '(fecha_inicio IS NULL OR fecha_inicio <= CURDATE())',
            '(fecha_fin IS NULL OR fecha_fin >= CURDATE())',
        ];

        foreach (array_keys($params) as $key) {
            // el nombre del placeholder lleva los dos puntos; la columna no
            $where[] = str_replace(':', '', $key) . ' = ' . $key;
        }

        $sqlWhere = implode(' AND ', $where);

        // Rango de ids que cumplen las condiciones, para sortear dentro de él
        $stmt = $this->db->prepare("SELECT MIN(id), MAX(id) FROM anuncios WHERE $sqlWhere");
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $range = $stmt->fetch(PDO::FETCH_NUM);

        if ($range === false || $range[0] === null || $range[1] === null) {
            return false;
        }

        $min = (int) $range[0];
        $max = (int) $range[1];
        $desde = $min + random_int(0, max(0, $max - $min));

        // Primer intento desde el id sorteado; si no cumple, segundo desde
        // el principio. Con pocos anuncios basta uno de los dos.
        for ($i = 0; $i < 2; $i++) {
            $stmt = $this->db->prepare(
                "SELECT * FROM anuncios WHERE $sqlWhere AND id >= :desde LIMIT 1"
            );
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':desde', $desde, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row !== false) {
                return $row;
            }

            $desde = $min;
        }

        return false;
    }

    public function getRandomByLocation($location)
    {
        return $this->randomWhere(['ubicacion' => $location]);
    }

    public function getRandom()
    {
        return $this->randomWhere([]);
    }

    public function getByLocation($location)
    {
        // fetch() devolvia una sola fila pese a que el nombre y el uso
        // sugieren una lista; ademas no filtraba por activo/vigencia
        $query = "SELECT * FROM anuncios
                  WHERE ubicacion = :location AND activo = 1
                    AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
                    AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
                  ORDER BY prioridad ASC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':location', $location);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve el id del anuncio creado, o null si fallo.
     * Antes el INSERT fijaba `fecha_fin = NOW() + 30 dias` de forma fija:
     * todo anuncio expiraba a los 30 dias sin que nadie lo pidiera.
     */
    public function create(
        $titulo,
        $imagen,
        $enlace,
        $posicion,
        $descripcion,
        $prioridad,
        $fecha_inicio = null,
        $fecha_fin = null,
        $activo = 1
    ) {
        $query = "INSERT INTO anuncios
                    (titulo, imagen, enlace, ubicacion, descripcion,
                     prioridad, activo, fecha_inicio, fecha_fin)
                  VALUES
                    (:titulo, :imagen, :enlace, :posicion, :descripcion,
                     :prioridad, :activo, :fecha_inicio, :fecha_fin)";

        try {
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':titulo', $titulo);
            $stmt->bindParam(':imagen', $imagen);
            $stmt->bindParam(':enlace', $enlace);
            $stmt->bindValue(':posicion', $posicion);
            $stmt->bindValue(':descripcion', $descripcion);
            $stmt->bindValue(':prioridad', (int) $prioridad, PDO::PARAM_INT);
            $stmt->bindValue(':activo', (int) $activo, PDO::PARAM_INT);
            // bindValue, no bindParam: un '' ?: null es un temporal y
            // bindParam exige una referencia
            $stmt->bindValue(':fecha_inicio', $fecha_inicio !== '' ? $fecha_inicio : null);
            $stmt->bindValue(':fecha_fin', $fecha_fin !== '' ? $fecha_fin : null);
            $stmt->execute();

            return (int) $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('Ad::create fallo: ' . $e->getMessage());
            return null;
        }
    }

    /** Devuelve true si se actualizo (o ya estaba en ese estado). */
    public function update(
        $id,
        $titulo,
        $imagen,
        $enlace,
        $posicion,
        $descripcion,
        $prioridad,
        $fecha_inicio = null,
        $fecha_fin = null,
        $activo = 1
    ) {
        $query = "UPDATE anuncios SET
                    titulo = :titulo,
                    imagen = :imagen,
                    enlace = :enlace,
                    ubicacion = :posicion,
                    descripcion = :descripcion,
                    prioridad = :prioridad,
                    activo = :activo,
                    fecha_inicio = :fecha_inicio,
                    fecha_fin = :fecha_fin
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':imagen', $imagen);
        $stmt->bindParam(':enlace', $enlace);
        $stmt->bindValue(':posicion', $posicion);
        $stmt->bindValue(':descripcion', $descripcion);
        $stmt->bindValue(':prioridad', (int) $prioridad, PDO::PARAM_INT);
        $stmt->bindValue(':activo', (int) $activo, PDO::PARAM_INT);
        $stmt->bindValue(':fecha_inicio', $fecha_inicio !== '' ? $fecha_inicio : null);
        $stmt->bindValue(':fecha_fin', $fecha_fin !== '' ? $fecha_fin : null);
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();

        // rowCount() es 0 tambien cuando el anuncio ya tenia esos valores,
        // asi que comprobamos existencia
        return $this->exists($id);
    }

    public function toggle($id)
    {
        $stmt = $this->db->prepare(
            "UPDATE anuncios SET activo = 1 - activo WHERE id = :id"
        );
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        $stmt->execute();

        return $this->exists($id);
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM anuncios WHERE id = :id");
        $stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
        return $stmt->execute() && $stmt->rowCount() > 0;
    }
}