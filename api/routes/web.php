<?php
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ArticleController.php';
require_once __DIR__ . '/../controllers/AdController.php';
require_once __DIR__ . '/../controllers/CategoryController.php';
require_once __DIR__ . '/../models/Article.php';
require_once __DIR__ . '/../config/middleware.php';
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$auth = new AuthController($db);
$articleController = new ArticleController($db);
$adController = new AdController($db);
$categoryController = new CategoryController($db);
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

// Listado para el panel: incluye borradores y artículos con deleted_at.
// Antes el panel reutilizaba /arts, que solo devuelve publicados, así que
// un artículo en borrador desaparecía de la lista y no se podía editar.
if ($uri === '/admin/arts' && $method === 'GET') {
	requireAuth();
	$articleController->adminIndex();
	exit;
}

// Artículos agrupados por categoría con su total. El panel lateral del sitio
// antes descargaba el listado entero y lo agrupaba en el navegador.
if ($uri === '/arts/grouped' && $method === 'GET') {
	$articleController->grouped();
	exit;
}

// Variante por query string que ya usaba el frontend en algunos puntos.
// Sin normalizar el valor, "Mi%20Artículo" llegaba con los % codificados.
if ($uri == '/art/' && $method === 'GET' && isset($_GET['enlace'])) {
	$articleController->show(urldecode((string) $_GET['enlace']));
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


if (preg_match('#^/art/search/(.+)$#', $uri, $matches) && $method === 'GET') {
	$articleController->search(urldecode($matches[1]));
	exit;
}

// Estas dos rutas TIENEN que evaluarse antes de /art/{slug}: si no, el patrón
// genérico se las come y /art/id/12 devolvía un artículo con enlace "id".
if (preg_match('#^/art/id/(\d+)$#', $uri, $matches) && $method === 'GET') {
	$articleController->showById((int) $matches[1]);
	exit;
}

if (preg_match('#^/art/rel/(.+)$#', $uri, $matches) && $method === 'GET') {
	$articleController->related(urldecode($matches[1]));
	exit;
}

if (preg_match('#^/art/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$articleController->show(urldecode($matches[1]));
	exit;
}

if ($uri == '/last' && $method === 'GET') {
	$articleController->last();
	exit;
}

if ($uri === '/user/create' && $method === 'POST') {
	// Antes: cualquier usuario autenticado podia crear otro usuario, y como
	// el DEFAULT de users.rol era 'admin', el nuevo usuario era administrador.
	requireRole('admin');
	$input = json_decode(file_get_contents("php://input"), true);
	$username = $input['username'] ?? '';
	$password = $input['password'] ?? '';
	echo json_encode($auth->register($username, $password));
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
	$articleController->delete((int) $matches[1]);
	exit;
}
if ($uri == '/imgs' && $method == 'GET') {
	requireAuth(); // antes cualquiera listaba el directorio de /media

	$folder = __DIR__ . '/../../media/';
	$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

	if (!is_dir($folder)) {
		echo json_encode([]);
		exit;
	}

	$files = array_filter(scandir($folder), function ($file) use ($folder, $allowedExtensions) {
		$path = $folder . $file;
		$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
		return is_file($path) && in_array($ext, $allowedExtensions, true);
	});

	$result = array_map(function ($file) use ($folder) {
		return [
			'nombre' => $file,
			// sin 'ruta': exponia la ruta absoluta del servidor
			'url' => 'media/' . $file,
			'tamano' => filesize($folder . $file),
			'fecha' => filemtime($folder . $file), // para ordenar por lo mas nuevo
		];
	}, array_values($files));

	usort($result, function ($a, $b) {
		return $b['fecha'] - $a['fecha'];
	});

	echo json_encode($result);
	exit;
}


if ($uri == '/upload/img' && $method == 'POST') {
	requireAuth(); // antes cualquiera podia subir archivos al servidor

	$mediaDir = __DIR__ . '/../../media/';

	if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
		http_response_code(400);
		echo json_encode(["error" => "Archivo no recibido correctamente"]);
		exit;
	}

	// Limite de tamano (el servidor suele imposinglo antes via php.ini)
	if ($_FILES['imagen']['size'] > 8 * 1024 * 1024) {
		http_response_code(413);
		echo json_encode(["error" => "La imagen supera el maximo de 8 MB"]);
		exit;
	}

	// Tipo MIME real del contenido, no el enviado por el navegador
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	$mime = finfo_file($finfo, $_FILES['imagen']['tmp_name']);
	finfo_close($finfo);

	if (strpos($mime, 'image/') !== 0) { // PHP 7.2: no existe str_starts_with
		http_response_code(415);
		echo json_encode(["error" => "El archivo no es una imagen"]);
		exit;
	}

	// getimagesize confirma que sea una imagen valida y devuelve sus dimensiones
	$info = @getimagesize($_FILES['imagen']['tmp_name']);
	if ($info === false) {
		http_response_code(415);
		echo json_encode(["error" => "El archivo de imagen esta corrupto"]);
		exit;
	}

	// Asegura que la carpeta exista
	if (!is_dir($mediaDir)) {
		mkdir($mediaDir, 0755, true);
	}

	$filename = uniqid('img_', true) . '.webp';
	$targetPath = $mediaDir . $filename;

	// Convertir a WebP REALMENTE. Antes solo se guardaba el binario original
	// con la extension .webp: un JPEG subido quedaba siendo un JPEG renombrado.
	$tmp = $_FILES['imagen']['tmp_name'];
	switch ($info[2]) {
		case IMAGETYPE_JPEG: $src = @imagecreatefromjpeg($tmp); break;
		case IMAGETYPE_PNG:  $src = @imagecreatefrompng($tmp);  break;
		case IMAGETYPE_GIF:  $src = @imagecreatefromgif($tmp);  break;
		case IMAGETYPE_WEBP: $src = @imagecreatefromwebp($tmp); break;
		default:             $src = false;                      break;
	}

	if ($src === false || !imagewebp($src, $targetPath, 82)) {
		if (is_resource($src)) {
			imagedestroy($src);
		}
		http_response_code(500);
		echo json_encode(["error" => "No se pudo procesar la imagen (falta GD con WebP en el servidor)"]);
		exit;
	}
	imagedestroy($src);

	echo json_encode([
		"status" => "success",
		"filename" => $filename,
		"url" => "media/" . $filename,
		"ancho" => $info[0],
		"alto" => $info[1],
	]);
	exit;
}

// ── Categorias ─────────────────────────────────────────────────────────────
// GET es publico: el sitio publico las usara para el filtro por seccion.
if ($uri === '/categorias' && $method === 'GET') {
	$categoryController->index();
	exit;
}

if ($uri === '/categorias' && $method === 'POST') {
	requireRole('admin');
	$categoryController->store();
	exit;
}

if (preg_match('#^/categorias/(\d+)$#', $uri, $matches) && $method === 'PUT') {
	requireRole('admin');
	$categoryController->update($matches[1]);
	exit;
}

if (preg_match('#^/categorias/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
	requireRole('admin');
	$categoryController->destroy($matches[1]);
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

// Anuncio aleatorio por ubicación.
// Antes llamaba a random($location), pero random() no acepta parámetros: el
// filtro por ubicación nunca se aplicaba y devolvía un anuncio de cualquier
// sitio. Debía llamar a randomByLocation().
if (preg_match('#^/ad/random/([^/]+)$#', $uri, $matches) && $method === 'GET') {
	$adController->randomByLocation(urldecode($matches[1]));
	exit;
}

// Anuncio aleatorio de cualquier ubicación. Debe evaluarse DESPUÉS de la
// ruta con ubicación, o el patrón anterior se la comería.
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

// Actualizar anuncio (requiere autenticación)
if (preg_match('#^/ad/update/(\d+)$#', $uri, $matches) && $method === 'POST') {
	requireAuth();
	$adController->update($matches[1]);
	exit;
}

// Activar / desactivar anuncio
if (preg_match('#^/ad/toggle/(\d+)$#', $uri, $matches) && $method === 'POST') {
	requireAuth();
	$adController->toggle($matches[1]);
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
	"uri" => $uri . ($_GET["enlace"] ?? '') . $method
]);
