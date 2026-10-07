<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Article.php';

class ArticleController
{
	private $model;

	public function __construct($db)
	{
		$this->model = new Article($db);
	}

	/**
	 * Listado. Acepta ?page= y ?per_page=; por compatibilidad con el cliente
	 * actual, ambos son opcionales y el comportamiento por defecto es igual
	 * que antes (todos los artículos).
	 */
	public function index()
	{
		$page    = max(1, (int) ($_GET['page'] ?? 1));
		// Tope de 100: nadie pide 10.000 filas de golpe
		$perPage = min((int) ($_GET['per_page'] ?? 0), 100);

		// Sin paginación explícita: comportamiento heredado
		if ($perPage <= 0) {
			echo json_encode($this->model->getAll());
			return;
		}

		echo json_encode([
			'data'       => $this->model->getAllPaginated($page, $perPage),
			'pagina'     => $page,
			'por_pagina' => $perPage,
			'total'      => $this->model->countAll(),
		]);
	}

	/** Listado completo para el panel, incluidos borradores y borrados. */
	public function adminIndex()
	{
		echo json_encode($this->model->getAllForAdmin());
	}

	/** Artículos agrupados por categoría, para el panel lateral del sitio. */
	public function grouped()
	{
		echo json_encode($this->model->getGrouped());
	}

	public function show($link)
	{
		$article = $this->model->getByLink($link);

		if (!$article) {
			// Antes devolvía 200 con "null": el cliente no distinguía entre
			// "no existe" y "error de red"
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Articulo no encontrado']);
			return;
		}

		echo json_encode($article);
	}

	public function last()
	{
		$article = $this->model->getByLast();

		if (!$article) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'No hay articulos publicados']);
			return;
		}

		echo json_encode($article);
	}

	public function showById($id)
	{
		$article = $this->model->getById((int) $id);

		if (!$article) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Articulo no encontrado']);
			return;
		}

		echo json_encode($article);
	}

	public function search($search)
	{
		$search = trim((string) $search);

		if ($search === '') {
			echo json_encode([]);
			return;
		}

		// El término va en la URL: se acota para no abusar del LIKE de fallback
		if (mb_strlen($search) > 100) {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'La busqueda es demasiado larga']);
			return;
		}

		echo json_encode($this->model->getSearch($search));
	}

	/**
	 * Normaliza el cuerpo JSON y aplica valores por defecto.
	 * Antes hacia `$data['img']` sin `??`, lo que generaba un warning si el
	 * campo no venia en el payload.
	 */
	private function payload()
	{
		$data = json_decode(file_get_contents('php://input'), true);
		if (!is_array($data)) {
			$data = [];
		}

		return [
			'title'       => trim((string) ($data['titulo'] ?? '')),
			'content'     => (string) ($data['contenido'] ?? ''),
			'link'        => trim((string) ($data['enlace'] ?? '')),
			'category'    => trim((string) ($data['categoria'] ?? 'Otro')),
			'description' => trim((string) ($data['descripcion'] ?? '')),
			'image'       => trim((string) ($data['img'] ?? '')),
		];
	}

	public function create()
	{
		$p = $this->payload();

		if ($p['title'] === '') {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'El titulo no puede estar vacio']);
			return;
		}
		if ($p['content'] === '') {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'El contenido no puede estar vacio']);
			return;
		}

		$this->model->create(
			$p['title'],
			$p['content'],
			$p['link'],
			$p['category'],
			$p['description'],
			$p['image']
		);
	}

	public function delete($id)
	{
		$this->model->delete((int) $id);
	}

	public function update($id)
	{
		$p = $this->payload();

		if ($p['title'] === '') {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'El titulo no puede estar vacio']);
			return;
		}

		$this->model->update(
			(int) $id,
			$p['title'],
			$p['content'],
			$p['link'],
			$p['category'],
			$p['description'],
			$p['image']
		);
	}
	public function related($link, $limit = 4)
	{
		$limit = max(1, min((int) $limit, 12));
		echo json_encode($this->model->getRelated($link, $limit));
	}

	public function comments($id)
	{
		echo json_encode($this->model->getComments((int) $id));
	}

	public function storeComment(int $articleId): void
	{
		// 10 comentarios por minuto como máximo
		$this->rateLimitComment($articleId);

		if (!$this->model->articleExists($articleId)) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Articulo no encontrado']);
			return;
		}

		$input = json_decode(file_get_contents('php://input'), true);

		if (!is_array($input)) {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'JSON invalido']);
			return;
		}

		$author  = trim((string) ($input['author'] ?? 'Anonimo'));
		$content = trim((string) ($input['content'] ?? ''));

		if ($content === '') {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'El comentario no puede estar vacio']);
			return;
		}

		// Tope de longitud: sin esto un solo POST puede meter 64 KB por artículo
		if (mb_strlen($content) > 2000) {
			http_response_code(422);
			echo json_encode(['status' => 'error', 'message' => 'El comentario es demasiado largo (max. 2000 caracteres)']);
			return;
		}

		$this->model->storeComment([
			'article_id' => $articleId,
			'author'     => mb_substr($author, 0, 50),
			'content'    => $content,
		]);
	}

	/**
	 * Límite de frecuencia por IP. El endpoint era público y sin límite:
	 * con el campo aprobado=0 hay moderación, pero el spam seguía llenando
	 * la tabla de pendientes.
	 */
	private function rateLimitComment(int $articleId): void
	{
		$dir = __DIR__ . '/../storage';
		if (!is_dir($dir)) {
			@mkdir($dir, 0755, true);
		}
		$file = $dir . '/comment_rate.json';
		$ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
		$key = hash('sha256', $ip);

		$max = 5;          // comentarios...
		$ventana = 600;    // ...en 10 minutos

		$data = [];
		if (is_file($file)) {
			$raw = @file_get_contents($file);
			$decoded = $raw ? json_decode($raw, true) : null;
			if (is_array($decoded)) {
				$data = $decoded;
			}
		}

		$ahora = time();

		if (isset($data[$key]) && ($ahora - (int) $data[$key]['ts']) < $ventana) {
			if ((int) $data[$key]['n'] >= $max) {
				http_response_code(429);
				echo json_encode([
					'status' => 'error',
					'message' => 'Demasiados comentarios seguidos. Espera unos minutos.',
				]);
				exit;
			}
			$data[$key]['n'] = (int) $data[$key]['n'] + 1;
		} else {
			$data[$key] = ['n' => 1, 'ts' => $ahora];
		}

		// Poda para que el archivo no crezca sin límite
		foreach ($data as $k => $entry) {
			if (($ahora - (int) $entry['ts']) > $ventana) {
				unset($data[$k]);
			}
		}

		@file_put_contents($file, json_encode($data), LOCK_EX);
	}
}
