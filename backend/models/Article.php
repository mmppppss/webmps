<?php
class Article {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM articulos ORDER BY id DESC";
        $stmt = $this->db->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByLink($link) {
        $query = "SELECT * FROM articulos WHERE enlace = :link LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':link', $link);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
	}

    public function getById($id) {
        $query = "SELECT * FROM articulos WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	public function create($title, $content, $link,$category, $description){
		$query = "INSERT INTO articulos (titulo, autor_id, contenido, categoria ,enlace, descripcion) VALUES (:title, :author, :content, :categoria, :link, :description)";
		$stmt = $this->db->prepare($query);
		$stmt->bindParam(":title", $title);
		$stmt->bindParam(":author", $_SESSION['user_id']);
		$stmt->bindParam(":content", $content);
		$stmt->bindParam(":categoria", $category);
		$stmt->bindParam(":link", $link);
		$stmt->bindParam(":description", $description);

		try {
			$stmt->execute();
			echo json_encode(["status" => "success", "message" => "Artículo creado"]);
		} catch (PDOException $e) {
			http_response_code(500);
			echo json_encode(["status" => "error", "message" => "Error al crear artículo".$e]);
		}
	}

	public function update($id, $title, $content, $link, $category, $description) {
		$query = "UPDATE articulos SET titulo = :title, autor_id = :author, contenido = :content, categoria = :category, enlace = :link, descripcion = :description WHERE id = :id";
		$stmt = $this->db->prepare($query);
		$stmt->bindParam(":title", $title);
		$stmt->bindParam(":author", $_SESSION['user_id']);
		$stmt->bindParam(":content", $content);
		$stmt->bindParam(":category", $category);
		$stmt->bindParam(":link", $link);
		$stmt->bindParam(":description", $description);
		$stmt->bindParam(":id", $id);
		$stmt->execute();
		if($stmt->rowCount() > 0) {
			http_response_code(200);
			echo json_encode(["status" => "success", "message" => "Artículo actualizado"]);
		} else {
			http_response_code(404);
			echo json_encode(["status" => "error", "message" => "Artículo no encontrado"]);
		}
	}

	public function delete($id) {
		$query = "DELETE FROM articulos WHERE id = :id";
		$stmt = $this->db->prepare($query);
		$stmt->bindParam(":id", $id);
		$stmt->execute();
		if($stmt->rowCount() > 0) {
			http_response_code(200);
			echo json_encode(["status" => "success", "message" => "Artículo eliminado"]);
		} else {
			http_response_code(404);
			echo json_encode(["status" => "error", "message" => "Artículo no encontrado"]);
		}
	}
}
?>
