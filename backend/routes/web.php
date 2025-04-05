<?php
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ArticleController.php';
require_once __DIR__ . '/../config/middleware.php';
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$auth = new AuthController($db);
$articleController = new ArticleController($db);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
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
if ($uri === '/is-auth' ){
	if(requireAuth()){
		echo json_encode([
			"status"=>"ok",
			"message"=>":)"
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

if ($uri =='/art/' && $method === 'GET' && isset($_GET['enlace'])) {
    $link = $_GET['enlace'];
	$articleController->show($link);
	exit;
}
if(preg_match('#^/art/([^/]+)$#', $uri, $matches) && $method === 'GET'){
	$link = "/".$matches[1];
	$articleController->show($link);
	exit;
}

if (preg_match('#^/art/(\d+)$#', $uri, $matches) && $method === 'GET') {
    $id = $matches[1]; 
    $articleController->showById($id);
    exit;
}


if($uri === '/user/create' && $method === 'POST'){
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


if (preg_match('#^/art/(\d+)$#', $uri, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $articleController->update($id);
    exit;
}

if (preg_match('#^/art/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
	requireAuth();
	$id = $matches[1];
	$articleController->delete($id);
	exit;
}

http_response_code(404);
echo json_encode([
    "status" => "error",
	"message" => "Ruta no encontrada o petición no válida",
	"uri" => $uri.$_GET["enlace"].$method
]);
