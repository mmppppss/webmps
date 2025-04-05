<?php
require_once __DIR__ . '/../models/Article.php';

class ArticleController {
    private $model;

    public function __construct($db) {
        $this->model = new Article($db);
    }

    public function index() {
        $articles = $this->model->getAll();
        echo json_encode($articles);
    }

    public function show($link) {
        $article = $this->model->getByLink($link);
        echo json_encode($article);
	}

	public function showById($id) {
		$article = $this->model->getById($id);
		echo json_encode($article);
	}
	
	public function create(){
		$data = json_decode(file_get_contents("php://input"), true);
		$title = $data['titulo'] ?? '';
		$content = $data['contenido'] ?? '';
		$link = $data['enlace'] ?? '';
		$category = $data['categoria'] ?? 'Otro';
		$description = $data['descripcion'] ?? '';
		$this->model->create($title, $content, $link, $category, $description);
	}

	public function delete($id) {
		$this->model->delete($id);
	}

	public function update($id) {
		$data = json_decode(file_get_contents("php://input"), true);
		$title = $data['titulo'] ?? '';
		$content = $data['contenido'] ?? '';
		$link = $data['enlace'] ?? '';
		$category = $data['categoria'] ?? 'Otro';
		$description = $data['descripcion'] ?? '';
		$this->model->update($id, $title, $content, $link, $category, $description);
	}
}
