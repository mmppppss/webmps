<?php
class Ad {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM anuncios ORDER BY prioridad DESC, fecha_inicio DESC";
        $stmt = $this->db->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getActiveByPosition($position) {
        $query = "SELECT * FROM  anuncios
                  WHERE activo = TRUE 
                  AND ubicacion = :position 
                  AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
                  AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
                  ORDER BY prioridad DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':position', $position);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM anuncios WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($titulo, $imagen, $enlace, $posicion, $descripcion,  $prioridad) {
        $query = "INSERT INTO anuncios (titulo, imagen, enlace, ubicacion, activo, fecha_inicio, fecha_fin, prioridad, descripcion)
                  VALUES (:titulo, :imagen, :enlace, :posicion, TRUE, now(), DATE_ADD(NOW(), INTERVAL 30 DAY), :prioridad, :descripcion)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':imagen', $imagen);
        $stmt->bindParam(':enlace', $enlace);
		$stmt->bindParam(':posicion', $posicion);
		$stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':prioridad', $prioridad);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Error al crear anuncio: " . $e->getMessage()]);
        }
    }

    public function update($id, $titulo, $imagen, $enlace, $posicion, $fecha_inicio, $fecha_fin, $prioridad, $activo) {
        $query = "UPDATE anuncios SET 
                    titulo = :titulo,
                    imagen = :imagen,
                    enlace = :enlace,
                    ubicacion = :posicion,
                    fecha_inicio = :fecha_inicio,
                    fecha_fin = :fecha_fin,
                    prioridad = :prioridad,
                    activo = :activo
                  WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':imagen', $imagen);
        $stmt->bindParam(':enlace', $enlace);
        $stmt->bindParam(':posicion', $posicion);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->bindParam(':prioridad', $prioridad);
        $stmt->bindParam(':activo', $activo);
        $stmt->bindParam(':id', $id);

        $stmt->execute();
        if($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "Anuncio actualizado"]);
        } else {
            echo json_encode(["status" => "error", "message" => "No se actualizó ningún anuncio"]);
        }
    }

    public function delete($id) {
        $query = "DELETE FROM anuncios WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
    	return $stmt->execute();
	}


	public function getRandomByLocation($location) {
    	$query = "SELECT * FROM anuncios WHERE ubicacion = :location AND activo = 1 ORDER BY RAND() LIMIT 1";
    	$stmt = $this->db->prepare($query);
    	$stmt->bindParam(':location', $location);
    	$stmt->execute();
    	return $stmt->fetch(PDO::FETCH_ASSOC);
	}
	public function getRandom() {
    	$query = "SELECT * FROM anuncios WHERE activo = 1 ORDER BY RAND() LIMIT 1";
    	$stmt = $this->db->prepare($query);
    	$stmt->execute();
    	return $stmt->fetch(PDO::FETCH_ASSOC);
	}

    public function getByLocation($location) {
        $query = "SELECT * FROM anuncios WHERE ubicacion = :location";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':location', $location);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
