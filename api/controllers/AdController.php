<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Ad.php';

class AdController
{
    private $model;

    /** Posiciones validas. Se puede ampliar sin tocar el frontend. */
    private const UBICACIONES = ['header', 'sidebar', 'footer', 'popup', 'inline'];

    private const PRIORIDADES = [1, 2, 3];

    public function __construct($db)
    {
        $this->model = new Ad($db);
    }

    public function index()
    {
        echo json_encode($this->model->getAll());
    }

    public function byLocation($location)
    {
        echo json_encode($this->model->getByLocation($location));
    }

    private function payload()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            $data = [];
        }

        return [
            'titulo'      => trim((string) ($data['titulo'] ?? '')),
            'imagen'      => trim((string) ($data['imagen'] ?? '')),
            'enlace'      => trim((string) ($data['enlace'] ?? '')),
            'ubicacion'   => trim((string) ($data['ubicacion'] ?? '')),
            'descripcion' => trim((string) ($data['descripcion'] ?? '')),
            'prioridad'   => (int) ($data['prioridad'] ?? 2),
            'fecha_inicio' => $data['fecha_inicio'] ?? null,
            'fecha_fin'   => $data['fecha_fin'] ?? null,
            'activo'      => isset($data['activo']) ? (int) (bool) $data['activo'] : 1,
        ];
    }

    /**
     * Valida el cuerpo del anuncio. Devuelve null si todo esta bien,
     * o un array con el error ya publicado en la respuesta.
     */
    private function validate(array $p)
    {
        if ($p['titulo'] === '') {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'El titulo no puede estar vacio']);
            return false;
        }

        if (!in_array($p['ubicacion'], self::UBICACIONES, true)) {
            http_response_code(422);
            echo json_encode([
                'status' => 'error',
                'message' => 'Ubicacion no valida. Opciones: ' . implode(', ', self::UBICACIONES),
            ]);
            return false;
        }

        if (!in_array($p['prioridad'], self::PRIORIDADES, true)) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'message' => 'Prioridad no valida (1, 2 o 3)']);
            return false;
        }

        if ($p['enlace'] !== '' && !filter_var($p['enlace'], FILTER_VALIDATE_URL)) {
            // solo si parece un enlace; si es relativo (ej. /pagina) se acepta
            if (strpos($p['enlace'], '/') !== 0) {
                http_response_code(422);
                echo json_encode(['status' => 'error', 'message' => 'El enlace no es valido']);
                return false;
            }
        }

        if ($p['fecha_fin'] !== null && $p['fecha_fin'] !== '') {
            $fin = strtotime((string) $p['fecha_fin']);
            if ($fin === false) {
                http_response_code(422);
                echo json_encode(['status' => 'error', 'message' => 'La fecha de fin no es valida']);
                return false;
            }
            if ($p['fecha_inicio'] && strtotime((string) $p['fecha_inicio']) > $fin) {
                http_response_code(422);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'La fecha de fin no puede ser anterior a la de inicio',
                ]);
                return false;
            }
        }

        return true;
    }

    public function create()
    {
        $p = $this->payload();
        if (!$this->validate($p)) {
            return;
        }

        $id = $this->model->create(
            $p['titulo'],
            $p['imagen'],
            $p['enlace'],
            $p['ubicacion'],
            $p['descripcion'],
            $p['prioridad'],
            $p['fecha_inicio'],
            $p['fecha_fin'],
            $p['activo']
        );

        if ($id === null) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar el anuncio']);
            return;
        }

        http_response_code(201);
        echo json_encode(['status' => 'success', 'id' => $id]);
    }

    public function update($id)
    {
        $p = $this->payload();
        if (!$this->validate($p)) {
            return;
        }

        $ok = $this->model->update(
            (int) $id,
            $p['titulo'],
            $p['imagen'],
            $p['enlace'],
            $p['ubicacion'],
            $p['descripcion'],
            $p['prioridad'],
            $p['fecha_inicio'],
            $p['fecha_fin'],
            $p['activo']
        );

        if (!$ok) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Anuncio no encontrado']);
            return;
        }

        echo json_encode(['status' => 'success', 'message' => 'Anuncio actualizado']);
    }

    public function toggle($id)
    {
        $ok = $this->model->toggle((int) $id);

        if (!$ok) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Anuncio no encontrado']);
            return;
        }

        echo json_encode(['status' => 'success']);
    }

    public function delete($id)
    {
        $deleted = $this->model->delete((int) $id);
        echo json_encode(["status" => $deleted ? "success" : "error"]);
    }

    public function randomByLocation($location)
    {
        $ad = $this->model->getRandomByLocation($location);
        echo json_encode($ad);
    }

    public function random()
    {
        $ad = $this->model->getRandom();
        echo json_encode($ad);
    }
}