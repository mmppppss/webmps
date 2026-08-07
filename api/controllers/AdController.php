<?php
require_once __DIR__ . '/../models/Ad.php';

class AdController {
    private $model;

    public function __construct($db) {
        $this->model = new Ad($db);
    }

    public function index() {
        $ads = $this->model->getAll();
        echo json_encode($ads);
    }

    public function byLocation($location) {
        $ads = $this->model->getByLocation($location);
        echo json_encode($ads);
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);
        $titulo = $data['titulo'] ?? '';
        $imagen = $data['imagen'] ?? '';
        $enlace = $data['enlace'] ?? '';
		$ubicacion = $data['ubicacion'] ?? '';
		$descripcion = $data['descripcion'] ?? '';
		$prioridad = $data['prioridad'] ?? '';
        $id = $this->model->create($titulo, $imagen, $enlace, $ubicacion, $descripcion, $prioridad);
        echo json_encode(["status" => "success"]);
    }

    public function delete($id) {
        $deleted = $this->model->delete($id);
        echo json_encode(["status" => $deleted ? "success" : "error"]);
	}

	public function randomByLocation($location) {
		$ad = $this->model->getRandomByLocation($location);
		echo json_encode($ad);
	}
	public function random() {
		$ad = $this->model->getRandom();
		echo json_encode($ad);
	}
}
?>
