<?php
$dotenv = parse_ini_file(__DIR__ . '/.env');
$siteUrl = $dotenv['SITE_URL'] ?? 'https://mmppppss.com';
$siteTitle = $dotenv['SITE_TITLE'] ?? 'MMPPPPS Blog';
$siteName = $dotenv['SITE_NAME'] ?? 'mmppppss';
$siteTwitter = $dotenv['SITE_TWITTER'] ?? '@mmppppss';

$request_uri = $_SERVER['REQUEST_URI'];
$enlace = trim($request_uri, "/");

if ($enlace == '' || $enlace == 'index.html') {
	readfile(__DIR__ . '/../index.html');
	exit;
}

if (file_exists(__DIR__ . '/../' . $enlace)) {
	$ext = pathinfo($enlace, PATHINFO_EXTENSION);
	$mimeTypes = [
		'js' => 'application/javascript',
		'css' => 'text/css',
		'png' => 'image/png',
		'jpg' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'webp' => 'image/webp',
		'gif' => 'image/gif',
		'svg' => 'image/svg+xml',
		'woff' => 'font/woff',
		'woff2' => 'font/woff2',
	];
	if (isset($mimeTypes[$ext])) {
		header('Content-Type: ' . $mimeTypes[$ext]);
		readfile(__DIR__ . '/../' . $enlace);
		exit;
	}
}

$api_url = "./public/index.php/art/" . urlencode($enlace);
$response = @file_get_contents($api_url);


$articulo = json_decode($response, true);

$titulo = htmlspecialchars($articulo['titulo']);
$descripcion = htmlspecialchars($articulo['descripcion']);
$url = $siteUrl . "/" . $enlace;
$imagen = $articulo['img'] ? $siteUrl . "/media/" . $articulo['img'] : $siteUrl . "/logomain.png";
$autor = htmlspecialchars($articulo['author']);
$fecha = $articulo['fecha'];
?>
<!DOCTYPE html>
<html lang="es">

<head>
	<meta charset="UTF-8" />
	<title><?= $titulo ?> | <?= $siteTitle ?></title>
	<meta name="description" content="<?= $descripcion ?>" />
	<meta name="author" content="<?= $autor ?>" />
	<meta name="robots" content="index, follow" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />

	<!-- Open Graph -->
	<meta property="og:title" content="<?= $titulo ?>" />
	<meta property="og:description" content="<?= $descripcion ?>" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="<?= $url ?>" />
	<meta property="og:image" content="<?= $imagen ?>" />
	<meta property="og:site_name" content="<?= $siteTitle ?>" />
	<meta property="article:published_time" content="<?= $fecha ?>" />
	<meta property="article:author" content="<?= $autor ?>" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="<?= $titulo ?>" />
	<meta name="twitter:description" content="<?= $descripcion ?>" />
	<meta name="twitter:image" content="<?= $imagen ?>" />
	<meta name="twitter:site" content="<?= $siteTwitter ?>" />

	<!-- Otros metadatos -->
	<meta name="keywords" content="<?= $siteName ?>, blog, personal" />
	<link rel="canonical" href="<?= $url ?>" />
	<link rel="icon" href="./logomain.png" />

    <script type="module" crossorigin src="./assets/index-C7wZeaSc.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-CBj0zb2P.css">
</head>

<body>
	<div id="root"></div>
</body>

</html>
