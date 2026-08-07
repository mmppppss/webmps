<?php
require_once __DIR__ . '/../models/Article.php';

class ArticleController
{
	private $model;

	public function __construct($db)
	{
		$this->model = new Article($db);
	}

	public function index()
	{
		$articles = $this->model->getAll();
		echo json_encode($articles);
	}

	public function show($link)
	{
		$article = $this->model->getByLink($link);
		echo json_encode($article);
	}
	public function last()
	{
		$article = $this->model->getByLast();
		echo json_encode($article);
	}

	public function showById($id)
	{
		$article = $this->model->getById($id);
		echo json_encode($article);
	}

	public function search($search)
	{
		$article = $this->model->getSearch($search);
		echo json_encode($article);
	}

	public function create()
	{
		$data = json_decode(file_get_contents("php://input"), true);
		$title = $data['titulo'] ?? '';
		$content = $data['contenido'] ?? '';
		$link = $data['enlace'] ?? '';
		$category = $data['categoria'] ?? 'Otro';
		$description = $data['descripcion'] ?? '';
		$imagen = $data['img'];
		$this->model->create($title, $content, $link, $category, $description, $imagen);
	}

	public function delete($id)
	{
		$this->model->delete($id);
	}

	public function update($id)
	{
		$data = json_decode(file_get_contents("php://input"), true);
		$title = $data['titulo'] ?? '';
		$content = $data['contenido'] ?? '';
		$link = $data['enlace'] ?? '';
		$category = $data['categoria'] ?? 'Otro';
		$description = $data['descripcion'] ?? '';
		$imagen = $data['img'];
		$this->model->update($id, $title, $content, $link, $category, $description, $imagen);
	}
	public function related($link)
	{
		$articles = $this->model->getRelated($link);
		echo json_encode($articles);
	}

	public function comments($id)
	{
		$articles = $this->model->getComments($id);
		echo json_encode($articles);
	}


	public function storeComment(int $articleId): void
	{
		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input) {
			http_response_code(400);
			echo json_encode([
				'error' => 'JSON inválido'
			]);
			return;
		}

		$author = trim($input['author'] ?? 'Anónimo');
		$content = trim($input['content'] ?? '');

		if ($content === '') {
			http_response_code(422);
			echo json_encode([
				'error' => 'El comentario no puede estar vacío'
			]);
			return;
		}

		$comment = $this->model->storeComment([
			'article_id' => $articleId,
			'author'     => $author,
			'content'    => $content
		]);
	}
}
