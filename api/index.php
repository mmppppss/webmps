<?php
/**
 * Capa de SEO para los artículos.
 *
 * Este archivo ES el servidor de la web pública. Toda la identidad (nombre,
 * título, descripción, URL canónica) sale de site.config.json, el mismo
 * archivo que lee el frontend.
 *
 * Nota de arquitectura: este archivo reemplaza por completo al antiguo
 * index.html. YA NO se lee index.html para servir la portada ni para
 * descubrir los assets del bundle: el PHP genera el HTML entero, y el nombre
 * del JS/CSS se resuelve desde el manifest de Vite (o, como fallback,
 * buscando en /assets/).
 *
 * En PRODUCCIÓN este archivo se mueve a la raíz del proyecto (junto a
 * api/, assets/, media/ y site.config.json). Por eso las rutas de
 * configuración se resuelven de forma que funcionen tanto cuando el
 * archivo vive en api/ (desarrollo en el repo) como cuando vive en la
 * raíz (producción).
 */

declare(strict_types=1);

// Si estamos en la raíz (producción): api/config/site.php
// Si estamos en api/ (desarrollo): __DIR__ ya es api/, así que config/...
$enRaiz = is_file(__DIR__ . '/api/config/site.php');

if ($enRaiz) {
	require_once __DIR__ . '/api/config/site.php';
	require_once __DIR__ . '/api/config/database.php';
	require_once __DIR__ . '/api/models/Category.php';
	require_once __DIR__ . '/api/models/Article.php';
	$raiz = __DIR__;
} else {
	require_once __DIR__ . '/config/site.php';
	require_once __DIR__ . '/config/database.php';
	require_once __DIR__ . '/models/Category.php';
	require_once __DIR__ . '/models/Article.php';
	$raiz = dirname(__DIR__);
}

// ── Identidad ───────────────────────────────────────────────────────────────
$siteName    = Site::nombre();
$siteTitle   = Site::titulo();
$siteUrl     = Site::url();
$idioma      = Site::idioma();
$locale      = (string) Site::get('locale', 'es_BO');
$themeColor  = (string) Site::get('themeColor', '#4fc3f7');
$favicon     = (string) Site::get('favicon', '/media/logomain.png');

// ── Ruta solicitada ─────────────────────────────────────────────────────────
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$enlace = trim(rawurldecode($requestPath), '/');

$mimeTypes = [
	'js'   => 'application/javascript; charset=utf-8',
	'css'  => 'text/css; charset=utf-8',
	'png'  => 'image/png',
	'jpg'  => 'image/jpeg',
	'jpeg' => 'image/jpeg',
	'webp' => 'image/webp',
	'avif' => 'image/avif',
	'gif'  => 'image/gif',
	'svg'  => 'image/svg+xml',
	'ico'  => 'image/x-icon',
	'json' => 'application/json',
	'woff' => 'font/woff',
	'woff2' => 'font/woff2',
	'txt'  => 'text/plain; charset=utf-8',
	'xml'  => 'application/xml',
	'webmanifest' => 'application/manifest+json',
];

// ── Archivos estáticos ──────────────────────────────────────────────────────
// Se valida que la ruta resuelta siga dentro de $raiz. Sin esta comprobación,
// file_exists() + readfile() permitirían leer ficheros fuera del proyecto con
// rutas tipo ../../api/.env
$rutaReal   = realpath($raiz . '/' . $enlace);
$raizReal   = realpath($raiz);
$dentroDeRaiz = $rutaReal !== false
	&& $raizReal !== false
	&& strpos(
		str_replace('\\', '/', $rutaReal),
		str_replace('\\', '/', $raizReal) . '/'
	) === 0;

if ($dentroDeRaiz && is_file($rutaReal)) {
	$ext = strtolower(pathinfo($rutaReal, PATHINFO_EXTENSION));

	if (isset($mimeTypes[$ext])) {
		header('Content-Type: ' . $mimeTypes[$ext]);
		header('X-Content-Type-Options: nosniff');

		// Los nombres de imagen llevan un uniqid, así que el contenido no
		// cambia nunca bajo la misma URL
		if (strpos($ext, 'woff') === 0
			|| in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'], true)
		) {
			header('Cache-Control: public, max-age=31536000, immutable');
		}

		readfile($rutaReal);
		exit;
	}
}

// ── ¿Es la portada? ─────────────────────────────────────────────────────────
$esPortada = ($enlace === '' || $enlace === 'index.html');
$es404 = false;
$articulo = false;

if ($esPortada) {
	// La portada no necesita DB: usa la identidad del sitio directamente.
	$titulo      = Site::titulo();
	$descripcion = (string) Site::get('descripcion');
	$url         = $siteUrl . '/';
	$imagen      = Site::imagen('');
	$autor       = $siteName;
	$categoria   = '';
	$fecha       = date('c');
} else {
	// ── Artículo ─────────────────────────────────────────────────────────────
	try {
		$db = (new Database())->getConnection();
		$articulo = (new Article($db))->getByLink($enlace);
	} catch (Throwable $e) {
		// Sin conexión a la BD no se puede renderizar el SEO, pero tampoco debe
		// tumbar el sitio: se sirve la app y ella mostrará su propio error.
		error_log('api/index.php: ' . $e->getMessage());
	}

	if (!$articulo || empty($articulo['titulo'])) {
		// 404 real. Antes se servía la portada con las metas vacías, lo que en
		// buscadores es un "soft 404" con contenido duplicado indexable.
		$es404 = true;
		http_response_code(404);

		$titulo      = 'Página no encontrada';
		$descripcion = 'La página que buscas no existe o fue movida.';
		$url         = $siteUrl . '/' . $enlace;
		$imagen      = Site::imagen('');
		$autor       = $siteName;
		$categoria   = '';
		$fecha       = date('c');
	} else {
		$titulo      = $articulo['titulo'];
		$descripcion = trim((string) $articulo['descripcion']);
		if ($descripcion === '') {
			$descripcion = mb_substr(trim(strip_tags((string) $articulo['contenido'])), 0, 155);
		}
		$url         = $siteUrl . '/' . rawurlencode((string) $articulo['enlace']);
		$imagen      = Site::imagen((string) ($articulo['img'] ?? ''));
		$autor       = !empty($articulo['author']) ? $articulo['author'] : $siteName;
		$categoria   = (string) ($articulo['categoria'] ?? '');
		$fecha       = !empty($articulo['created_at'])
			? date('c', strtotime((string) $articulo['created_at']))
			: date('c');
	}
}

// Google recorta alrededor de 160 caracteres en la descripción
$descripcion = mb_substr($descripcion, 0, 160);

$e = function ($v) {
	return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
};

// ── Bundle ──────────────────────────────────────────────────────────────────
// El nombre del JS y del CSS se lee del manifiesto de Vite. Antes estaban
// escritos a mano en el HTML (index-C7wZeaSc.js) y dejaban de existir en
// cuanto se regeneraba el build.
$entry   = null;
$cssList = [];

$candidatosManifest = [
	$raiz . '/dist/.vite/manifest.json',  // si conservas la carpeta dist/
	$raiz . '/.vite/manifest.json',       // si subiste el CONTENIDO de dist/
];

foreach ($candidatosManifest as $manifiesto) {
	if (!is_file($manifiesto)) {
		continue;
	}

	$manifest = json_decode((string) file_get_contents($manifiesto), true);
	if (is_array($manifest)) {
		$entry   = $manifest['index.html']['file']   ?? null;
		$cssList = $manifest['index.html']['css'] ?? [];

		// El manifest usa rutas relativas a dist/ (assets/...). Si subiste solo
		// el contenido de dist/, esas mismas rutas ya cuelgan de la raíz.
		break;
	}
}

if ($entry === null) {
	// Fallback: busca el primer JS de assets/ que empiece por "index-"
	$candidatosJs = glob($raiz . '/dist/assets/index-*.js')
		?: glob($raiz . '/assets/index-*.js');

	if (!empty($candidatosJs)) {
		$entry = (strpos($candidatosJs[0], '/dist/') !== false ? 'dist/' : '')
			. 'assets/' . basename($candidatosJs[0]);

		foreach (glob($raiz . '/dist/assets/index-*.css') ?: glob($raiz . '/assets/index-*.css') as $css) {
			$cssList[] = (strpos($css, '/dist/') !== false ? 'dist/' : '')
				. 'assets/' . basename($css);
		}
	}
}

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-cache');

if ($es404) {
	header('X-Robots-Tag: noindex, follow');
}
?>
<!DOCTYPE html>
<html lang="<?= $e($idioma) ?>">

<head>
	<meta charset="UTF-8" />
	<title><?= $e($es404 ? $titulo . ' · ' . $siteTitle : $titulo . ($esPortada ? '' : ' | ' . $siteTitle)) ?></title>
	<meta name="description" content="<?= $e($descripcion) ?>" />
	<meta name="robots" content="<?= $es404 ? 'noindex, follow' : 'index, follow, max-image-preview:large' ?>" />
	<meta name="author" content="<?= $e($autor) ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content="<?= $e($themeColor) ?>" />

	<!-- Open Graph -->
	<meta property="og:site_name" content="<?= $e($siteName) ?>" />
	<meta property="og:title" content="<?= $e($titulo) ?>" />
	<meta property="og:description" content="<?= $e($descripcion) ?>" />
	<meta property="og:type" content="<?= $es404 || $esPortada ? 'website' : 'article' ?>" />
	<meta property="og:url" content="<?= $e($url) ?>" />
	<meta property="og:image" content="<?= $e($imagen) ?>" />
	<meta property="og:locale" content="<?= $e($locale) ?>" />
	<?php if (!$es404 && !$esPortada): ?>
	<meta property="article:published_time" content="<?= $e($fecha) ?>" />
	<meta property="article:modified_time" content="<?= $e($fecha) ?>" />
	<meta property="article:author" content="<?= $e($autor) ?>" />
	<meta property="article:section" content="<?= $e($categoria) ?>" />
	<?php endif; ?>

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="<?= $e($titulo) ?>" />
	<meta name="twitter:description" content="<?= $e($descripcion) ?>" />
	<meta name="twitter:image" content="<?= $e($imagen) ?>" />
	<?php if (Site::get('twitter', '') !== ''): ?>
	<meta name="twitter:site" content="<?= $e(Site::get('twitter')) ?>" />
	<?php endif; ?>

	<meta name="keywords" content="<?= $e(Site::get('keywords')) ?>" />
	<link rel="canonical" href="<?= $e($url) ?>" />
	<link rel="icon" href="<?= $e($favicon) ?>" />
	<link rel="sitemap" type="application/xml" href="/sitemap.xml" />

	<?php foreach ($cssList as $css): ?>
	<link rel="stylesheet" href="/<?= $e($css) ?>">
	<?php endforeach; ?>
</head>

<body>
	<div id="root"></div>
	<?php if ($entry !== null): ?>
	<script type="module" crossorigin src="/<?= $e($entry) ?>"></script>
	<?php endif; ?>
</body>

</html>
