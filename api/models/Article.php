<?php
declare(strict_types=1);

class Article
{
	/**
	 * Transliteración de acentos para el slug. Se declara como constante
	 * para no reallocarla en cada llamada.
	 */
	private const MAPA_ASCII = array(
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
	);

	private $db;
	private $categoryModel;

	public function __construct($db)
	{
		$this->db = $db;
		require_once __DIR__ . '/Category.php';
		$this->categoryModel = new Category($db);
	}

	/**
	 * Normaliza el enlace (slug) a formato de URL.
	 * Antes el panel hacia `value.replaceAll("/", "")` en el navegador y el
	 * backend aceptaba lo que llegara: un titulo como "Camiri: fixtures 2026"
	 * generaba un enlace roto o con espacios.
	 */
	private function slugify($texto)
	{
		$texto = strtr((string) $texto, self::MAPA_ASCII);

		// iconv() no siempre está disponible (extensión.iconv en PHP CLI, o
		// deshabilitado por el hosting). Si existe, se usa para descomponer;
		// si no, el mapa de arriba ya cubre el español y el resto se descarta
		// con el preg_replace.
		if (function_exists('iconv')) {
			$convertido = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
			if ($convertido !== false && $convertido !== '') {
				$texto = $convertido;
			}
		}

		$texto = preg_replace('/[^a-zA-Z0-9]+/', '-', $texto);
		$texto = trim(strtolower((string) $texto), '-');

		return $texto !== '' ? $texto : 'articulo';
	}

	/**
	 * Garantiza que el enlace sea unico, anadiendo -2, -3, ... si hace falta.
	 * Dos articulos con el mismo titulo chocarian en el indice UNIQUE y el
	 * segundo se perderia.
	 */
	private function uniqueEnlace($enlace, $excludeId = null)
	{
		$base = $this->slugify($enlace);
		$slug = $base;
		$n    = 2;

		$sql = "SELECT COUNT(*) FROM articulos WHERE enlace = :enlace";
		if ($excludeId !== null) {
			$sql .= " AND id <> :id";
		}

		while (true) {
			$stmt = $this->db->prepare($sql);
			$stmt->bindParam(':enlace', $slug);
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

	/**
	 * Listado para el portal y el panel.
	 *
	 * Antes hacia `SELECT articulos.*`, que incluye `contenido`: el sitio
	 * publico descargaba el cuerpo markdown completo de TODOS los articulos
	 * solo para pintar la lista. Ahora se piden solo los campos necesarios y
	 * el cuerpo se trae en getByLink().
	 */
	public function getAll()
	{
		$query = "SELECT a.id, a.titulo, a.enlace, a.categoria, a.descripcion,
		                 a.img, a.vistas, a.created_at, a.updated_at,
		                 a.status, a.destacado,
		                 u.username AS author
		          FROM articulos a
		          LEFT JOIN users u ON a.autor_id = u.id
		          WHERE a.deleted_at IS NULL AND a.status = 'publicado'
		          ORDER BY a.created_at DESC";
		$stmt = $this->db->query($query);
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	/** Listado paginado. El contenido se excluye a propósito. */
	public function getAllPaginated($page = 1, $perPage = 20)
	{
		$offset = max(0, ((int) $page - 1) * (int) $perPage);

		$stmt = $this->db->prepare(
			"SELECT a.id, a.titulo, a.enlace, a.categoria, a.descripcion,
			        a.img, a.vistas, a.created_at, a.status, a.destacado,
			        u.username AS author
			 FROM articulos a
			 LEFT JOIN users u ON a.autor_id = u.id
			 WHERE a.deleted_at IS NULL AND a.status = 'publicado'
			 ORDER BY a.created_at DESC, a.id DESC
			 LIMIT $perPage OFFSET $offset"
		);
		$stmt->execute();
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function countAll()
	{
		$stmt = $this->db->query(
			"SELECT COUNT(*) FROM articulos
			 WHERE deleted_at IS NULL AND status = 'publicado'"
		);
		return (int) $stmt->fetchColumn();
	}

	/** Listado para el panel: incluye borradores y borrados lógicos. */
	public function getAllForAdmin()
	{
		$stmt = $this->db->query(
			"SELECT a.id, a.titulo, a.enlace, a.categoria, a.descripcion, a.img,
			        a.vistas, a.created_at, a.updated_at, a.status, a.destacado,
			        a.deleted_at, u.username AS author
			 FROM articulos a
			 LEFT JOIN users u ON a.autor_id = u.id
			 ORDER BY a.created_at DESC, a.id DESC"
		);
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	/**
	 * Artículos agrupados por categoría para el panel lateral del sitio.
	 * Antes el frontend traía TODOS los artículos y los agrupaba en el
	 * navegador, con lo que la barra lateral pagaba el listado entero.
	 */
	public function getGrouped()
	{
		$stmt = $this->db->query(
			"SELECT categoria, COUNT(*) AS total
			 FROM articulos
			 WHERE deleted_at IS NULL AND status = 'publicado'
			 GROUP BY categoria
			 ORDER BY categoria ASC"
		);

		$result = [];
		foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
			$result[] = [
				'categoria' => $fila['categoria'],
				'total'     => (int) $fila['total'],
			];
		}

		return $result;
	}

	public function articleExists($id)
	{
		$stmt = $this->db->prepare(
			"SELECT 1 FROM articulos WHERE id = :id AND deleted_at IS NULL LIMIT 1"
		);
		$stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
		$stmt->execute();
		return (bool) $stmt->fetchColumn();
	}

	public function getByLink($link, $countView = true)
	{
		$query = "SELECT a.*, u.username AS author
		          FROM articulos a
		          LEFT JOIN users u ON a.autor_id = u.id
		          WHERE a.enlace = :link
		            AND a.deleted_at IS NULL
		            AND a.status = 'publicado'
		          LIMIT 1";
		$stmt = $this->db->prepare($query);
		$stmt->bindParam(':link', $link);
		$stmt->execute();
		$results = $stmt->fetch(PDO::FETCH_ASSOC);

		if ($results && $countView && !$this->isBot()) {
			// Antes contaba también a Googlebot y a los previsualizadores de
			// redes, que inflan las vistas en varias veces el valor real
			$upstmt = $this->db->prepare("UPDATE articulos SET vistas = vistas + 1 WHERE enlace = :link");
			$upstmt->bindParam(':link', $link);
			$upstmt->execute();
		}

		return $results;
	}

	private function isBot()
	{
		$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
		if ($ua === '') {
			return true;
		}
		return (bool) preg_match('/bot|crawler|spider|slurp|facebookexternalhit|whatsapp|twitterbot|preview/i', $ua);
	}

	public function getById($id)
	{
		$query = "SELECT a.*, u.username AS author
		          FROM articulos a
		          LEFT JOIN users u ON a.autor_id = u.id
		          WHERE a.id = :id AND a.deleted_at IS NULL
		          LIMIT 1";
		$stmt = $this->db->prepare($query);
		$stmt->bindValue(':id', (int) $id, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	public function getByLast()
	{
		$query = "SELECT a.*, u.username AS author
		          FROM articulos a
		          LEFT JOIN users u ON a.autor_id = u.id
		          WHERE a.status = 'publicado' AND a.deleted_at IS NULL
		          ORDER BY a.created_at DESC, a.id DESC
		          LIMIT 1";
		$stmt = $this->db->prepare($query);
		$stmt->execute();
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	/**
	 * Relacionados por categoría.
	 *
	 * Antes hacía cuatro LIKE '%titulo%' (full table scan sobre el contenido)
	 * y devolvía artículos que solo coincidían en una palabra suelta. Ahora
	 * usa el índice de `categoria` y, si no hay suficientes, completa con los
	 * más recientes.
	 */
	public function getRelated($link, $limit = 4)
	{
		$art = $this->getByLink($link, false);

		if (!$art) {
			return [];
		}

		$stmt = $this->db->prepare(
			"SELECT id, titulo, enlace, descripcion, img, categoria
			 FROM articulos
			 WHERE categoria = :categoria
			   AND enlace <> :link
			   AND status = 'publicado'
			   AND deleted_at IS NULL
			 ORDER BY created_at DESC
			 LIMIT :limite"
		);
		$stmt->bindParam(':categoria', $art['categoria']);
		$stmt->bindParam(':link', $link);
		$stmt->bindValue(':limite', (int) $limit, PDO::PARAM_INT);
		$stmt->execute();
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

		// Si la categoría no reaches el límite, completa con los más recientes
		if (count($results) < $limit) {
			$faltan = $limit - count($results);
			$excluidos = array_merge([$link], array_column($results, 'enlace'));
			$in = implode(',', array_fill(0, count($excluidos), '?'));

			$stmt = $this->db->prepare(
				"SELECT id, titulo, enlace, descripcion, img, categoria
				 FROM articulos
				 WHERE enlace NOT IN ($in)
				   AND status = 'publicado'
				   AND deleted_at IS NULL
				 ORDER BY created_at DESC
				 LIMIT $faltan"
			);
			$stmt->execute($excluidos);
			$results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));
		}

		return $results;
	}

	/**
	 * Búsqueda con índice FULLTEXT.
	 *
	 * El LIKE '%q%' anterior hacía full table scan sobre `contenido`. MariaDB
	 * no usa el índice FULLTEXT para términos de menos de 4 caracteres
	 * (ft_min_word_len), así que se recurre a LIKE en ese caso.
	 */
	public function getSearch($search)
	{
		$search = trim((string) $search);

		if ($search === '') {
			return [];
		}

		$stmt = $this->db->prepare(
			"SELECT id, titulo, enlace, descripcion, img, categoria, created_at,
			        u.username AS author
			 FROM articulos a
			 LEFT JOIN users u ON a.autor_id = u.id
			 WHERE a.status = 'publicado' AND a.deleted_at IS NULL
			   AND MATCH(a.titulo, a.descripcion, a.contenido)
			       AGAINST (:q IN NATURAL LANGUAGE MODE)
			 ORDER BY a.created_at DESC"
		);
		$stmt->bindParam(':q', $search);
		$stmt->execute();
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

		if (count($results) > 0) {
			return $results;
		}

		// Fallback para términos cortos o sin resultados por stopwords
		$like = '%' . $search . '%';
		$stmt = $this->db->prepare(
			"SELECT id, titulo, enlace, descripcion, img, categoria, created_at,
			        u.username AS author
			 FROM articulos a
			 LEFT JOIN users u ON a.autor_id = u.id
			 WHERE a.status = 'publicado' AND a.deleted_at IS NULL
			   AND (a.titulo LIKE :t OR a.descripcion LIKE :d)
			 ORDER BY a.created_at DESC
			 LIMIT 30"
		);
		$stmt->bindParam(':t', $like);
		$stmt->bindParam(':d', $like);
		$stmt->execute();

		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function create($title, $content, $link, $category, $description, $image)
	{
		$title = trim((string) $title);
		$description = trim((string) $description);
		$image = trim((string) $image);

		if ($title === '') {
			http_response_code(422);
			echo json_encode(["status" => "error", "message" => "El titulo no puede estar vacio"]);
			return;
		}

		// Si no se envió enlace, se deriva del título
		if (trim((string) $link) === '') {
			$link = $title;
		}
		$link = $this->uniqueEnlace($link);

		// La categoría se registra sola si es nueva, para que el select del
		// panel nunca pierda lo que el usuario acaba de escribir
		$category = $this->categoryModel->ensure($category);

		$query = "INSERT INTO articulos (titulo, autor_id, contenido, categoria, enlace, descripcion, img)
				  VALUES (:title, :author, :content, :categoria, :link, :description, :img)";
		$stmt = $this->db->prepare($query);
		$stmt->bindValue(":title", $title);
		$stmt->bindValue(":author", isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null, PDO::PARAM_INT);
		$stmt->bindValue(":content", (string) $content);
		$stmt->bindValue(":categoria", $category !== null ? $category : 'Otro');
		$stmt->bindValue(":link", $link);
		$stmt->bindValue(":description", $description);
		$stmt->bindValue(":img", $image);

		try {
			$stmt->execute();
			echo json_encode([
				"status" => "success",
				"message" => "Articulo creado",
				"id" => (int) $this->db->lastInsertId(),
				"enlace" => $link,
			]);
		} catch (PDOException $e) {
			// Concatenar el objeto Exception a un string es un error fatal
			error_log('Article::create fallo: ' . $e->getMessage());
			http_response_code(500);
			echo json_encode(["status" => "error", "message" => "No se pudo crear el articulo"]);
		}
	}

	public function update($id, $title, $content, $link, $category, $description, $image)
	{
		$title = trim((string) $title);
		$description = trim((string) $description);
		$image = trim((string) $image);

		if ($title === '') {
			http_response_code(422);
			echo json_encode(["status" => "error", "message" => "El titulo no puede estar vacio"]);
			return;
		}

		if (trim((string) $link) === '') {
			$link = $title;
		}
		$link = $this->uniqueEnlace($link, (int) $id);

		$category = $this->categoryModel->ensure($category);

		$query = "UPDATE articulos
				  SET titulo = :title,
					  contenido = :content,
					  categoria = :category,
					  enlace = :link,
					  descripcion = :description,
					  img = :img
				  WHERE id = :id";
		$stmt = $this->db->prepare($query);
		$stmt->bindValue(":title", $title);
		$stmt->bindValue(":content", (string) $content);
		$stmt->bindValue(":category", $category !== null ? $category : 'Otro');
		$stmt->bindValue(":link", $link);
		$stmt->bindValue(":description", $description);
		$stmt->bindValue(":img", $image);
		$stmt->bindValue(":id", (int) $id, PDO::PARAM_INT);
		$stmt->execute();

		// rowCount() devuelve 0 también cuando los valores no cambiaron,
		// así que primero se comprueba que el artículo exista
		if (!$this->getById((int) $id)) {
			http_response_code(404);
			echo json_encode(["status" => "error", "message" => "Articulo no encontrado"]);
			return;
		}

		echo json_encode([
			"status" => "success",
			"message" => "Articulo actualizado",
			"enlace" => $link,
		]);
	}

	public function delete($id)
	{
		// Borrado logico: los comentarios y las métricas se conservan.
		// El DELETE físico anterior dejaba el artículo sin rastro y era
		// irreversible desde el panel.
		$stmt = $this->db->prepare(
			"UPDATE articulos SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL"
		);
		$stmt->bindValue(":id", (int) $id, PDO::PARAM_INT);
		$stmt->execute();

		if ($stmt->rowCount() > 0) {
			http_response_code(200);
			echo json_encode(["status" => "success", "message" => "Articulo eliminado"]);
			return;
		}

		// Si no se actualizó nada puede que ya estuviera borrado
		$existe = $this->db->prepare("SELECT 1 FROM articulos WHERE id = :id LIMIT 1");
		$existe->bindValue(":id", (int) $id, PDO::PARAM_INT);
		$existe->execute();

		if ($existe->fetch()) {
			echo json_encode(["status" => "success", "message" => "Articulo ya estaba eliminado"]);
			return;
		}

		http_response_code(404);
		echo json_encode(["status" => "error", "message" => "Articulo no encontrado"]);
	}

	public function getComments($id)
	{
		$query = "SELECT id, autor, contenido, created_at
		          FROM comentarios
		          WHERE id_art = :id AND aprobado = 1 AND deleted_at IS NULL
		          ORDER BY created_at DESC";
		$stmt = $this->db->prepare($query);
		$stmt->bindValue(":id", (int) $id, PDO::PARAM_INT);
		$stmt->execute();
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function storeComment(array $data)
	{
		// Los comentarios nuevos entran con aprobado=0. Antes el INSERT no fijaba
		// el campo y cualquier visitante escribía en cualquier artículo con
		// publicación inmediata: spam abierto.
		$stmt = $this->db->prepare("
			INSERT INTO comentarios (id_art, autor, contenido, aprobado, ip_hash)
			VALUES (:article_id, :author, :content, 0, :ip_hash)
		");

		// Hash del IP en vez del IP en claro: permite bloquear sin almacenar
		// datos personales. Necesita COMMENT_HASH_SECRET en api/.env.
		// Se buscan las tres fuentes porque $_ENV solo se rellena cuando
		// Database ya se ha construido, y no siempre ocurre antes.
		$secret = $_ENV['COMMENT_HASH_SECRET']
			?? getenv('COMMENT_HASH_SECRET')
			?: '';
		$ip     = $_SERVER['REMOTE_ADDR'] ?? '';
		$ipHash = ($secret !== '' && $ip !== '') ? hash('sha256', $ip . $secret) : null;

		try {
			$stmt->execute([
				':article_id' => $data['article_id'],
				':author'     => $data['author'],
				':content'    => $data['content'],
				':ip_hash'    => $ipHash,
			]);

			echo json_encode([
				"status" => "success",
				"message" => "Comentario recibido. Aparecera cuando sea moderado.",
			]);
		} catch (PDOException $e) {
			// Nunca concatenar el objeto Exception a un string: es un error fatal
			error_log('Article::storeComment fallo: ' . $e->getMessage());
			http_response_code(500);
			echo json_encode(["status" => "error", "message" => "No se pudo guardar el comentario"]);
		}
	}
}