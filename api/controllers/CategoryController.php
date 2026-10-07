<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Category.php';

class CategoryController
{
    private $model;

    public function __construct($db)
    {
        $this->model = new Category($db);
    }

    public function index()
    {
        echo json_encode($this->model->getAll());
    }

    public function store()
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $nombre = $input['nombre'] ?? '';

        $result = $this->model->create($nombre);

        if (isset($result['error'])) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => $result['error']]);
            return;
        }

        http_response_code(201);
        echo json_encode(['status' => 'success'] + $result);
    }

    public function update($id)
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $result = $this->model->update((int) $id, $input['nombre'] ?? '');

        if (isset($result['error'])) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => $result['error']]);
            return;
        }

        echo json_encode(['status' => 'success'] + $result);
    }

    public function destroy($id)
    {
        $result = $this->model->delete((int) $id);

        if (isset($result['error'])) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => $result['error']]);
            return;
        }

        echo json_encode(['status' => 'success'] + $result);
    }
}