<?php
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ArticleController.php';
require_once __DIR__ . '/../controllers/AdController.php';
require_once __DIR__ . '/../config/middleware.php';
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$auth = new AuthController($db);
$articleController = new ArticleController($db);
$adController = new AdController($db);
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/api/public/index.php', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];



if ($uri === '/login' && $method === 'POST') {
	$input = json_decode(file_get_contents("php://input"), true);
	$username = $input['username'] ?? '';
	$password = $input['password'] ?? '';

	$auth = new AuthController();
	$response = $auth->login($username, $password);

	echo json_encode($response);
	exit;
}
if ($uri === '/is-auth') {
	if (requireAuth()) {
		echo json_encode([
			"status" => "ok",
			"message" => ":)"
		]);
	}
	exit;
}
if ($uri === '/logout' && $method === 'POST') {
	requireAuth();
	echo json_encode($auth->logout());
	exit;
}

if ($uri === '/arts' && $method === 'GET') {
	$articleController->index();
	exit;
}

if ($uri == '/art/' && $method === 'GET' && isset($_GET['enlace'])) {
	$link = $_GET['enlace'];
	$articleController->show($link);
	exit;
}

if (preg_match('#^/art/comments/(\d+)$#', $uri, $matches)) {
    $id = (int)$matches[1];

    if ($method === 'GET') {
        $articleController->comments($id);
        exit;
    }

    if ($method === 'POST') {
        $articleController->storeComment($id);
        exit;
    }
}


if (preg_match('#^/art/search/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$link = $matches[1];
	$articleController->search($link);
	exit;
}


if (preg_match('#^/art/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$link = $matches[1];
	$articleController->show($link);
	exit;
}

if (preg_match('#^/art/id/(\d+)$#', $uri, $matches) && $method === 'GET') {
	$id = $matches[1];
	$articleController->showById($id);
	exit;
}

if ($uri == '/last' && $method === 'GET' && !isset($_GET['enlace'])) {
	$articleController->last();
	exit;
}

if ($uri === '/user/create' && $method === 'POST') {
	requireAuth();
	$input = json_decode(file_get_contents("php://input"), true);
	$username = $input['username'] ?? '';
	$password = $input['password'] ?? '';
	$auth->register($username, $password);
	exit;
}

if ($uri === '/art/create' && $method === 'POST') {
	requireAuth();
	$articleController->create();
	exit;
}


if (preg_match('#^/art/update/(\d+)$#', $uri, $matches) && $method === 'POST') {
	requireAuth();
	$id = $matches[1];
	$articleController->update($id);
	exit;
}

if (preg_match('#^/art/delete/(\d+)$#', $uri, $matches) && $method === 'POST') {
	requireAuth();
	$id = $matches[1];
	$articleController->delete($id);
	exit;
}
if (preg_match('#^/art/rel/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$id = $matches[1];
	$articleController->related($id);
	exit;
}
if ($uri == '/imgs' && $method == 'GET') {
	$folder = __DIR__ . '/../../media/';
	$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

	$files = array_filter(scandir($folder), function ($file) use ($folder, $allowedExtensions) {
		$path = $folder . $file;
		$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
		return is_file($path) && in_array($ext, $allowedExtensions);
	});

	$result = array_map(function ($file) use ($folder) {
		return [
			'nombre' => $file,
			'ruta' => $folder . $file,
			'url' => 'media/' . $file,
			'tamano' => filesize($folder . $file)
		];
	}, $files);

	echo json_encode($result);
	exit;
}


if ($uri == '/upload/img' && $method == 'POST') {
	$mediaDir = __DIR__ . '/../../media/';
	if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
		http_response_code(400);
		echo json_encode(["error" => "Archivo no recibido correctamente"]);
		exit;
	}

	// Verifica tipo MIME (debe ser imagen)
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	$mime = finfo_file($finfo, $_FILES['imagen']['tmp_name']);
	finfo_close($finfo);

	if (!str_starts_with($mime, 'image/')) {
		http_response_code(415);
		echo json_encode(["error" => "El archivo no es una imagen"]);
		exit;
	}

	// Asegura que la carpeta exista
	if (!is_dir($mediaDir)) {
		mkdir($mediaDir, 0755, true);
	}

	$ext = '.webp';
	$filename = uniqid('img_', true) . $ext;
	$targetPath = $mediaDir . $filename;

	if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetPath)) {
		echo json_encode([
			"status" => "success",
			"filename" => $filename
		]);
	} else {
		http_response_code(500);
		echo json_encode(["error" => "No se pudo guardar el archivo"]);
	}
	exit;
}

// Obtener todos los anuncios
if ($uri === '/ad' && $method === 'GET') {
	$adController->index();
	exit;
}

// Obtener anuncios por ubicación
if (preg_match('#^/ad/location/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$location = $matches[1];
	$adController->byLocation($location);
	exit;
}

// Obtener anuncio aleatorio por ubicación
if (preg_match('#^/ad/random/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$location = $matches[1];
	$adController->random($location);
	exit;
}

if ($uri === '/ad/random' && $method === 'GET') {
	$adController->random();
	exit;
}

// Crear anuncio (requiere autenticación)
if ($uri === '/ad/create' && $method === 'POST') {
	requireAuth();
	$adController->create();
	exit;
}

// Eliminar anuncio por ID (requiere autenticación)
if (preg_match('#^/ad/delete/(\d+)$#', $uri, $matches) && $method === 'POST') {
	requireAuth();
	$id = $matches[1];
	$adController->delete($id);
	exit;
}




http_response_code(404);
echo json_encode([
	"status" => "error",
	"message" => "Ruta no encontrada o petición no válida",
	"uri" => $uri . $_GET["enlace"] . $method
]);
