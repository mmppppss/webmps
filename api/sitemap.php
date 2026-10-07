<?php
/**
 * sitemap.xml generado desde la base de datos.
 *
 * Antes no existía sitemap, así que los buscadores solo podían descubrir los
 * artículos a través del panel lateral.
 *
 * La URL base sale de site.config.json, no de SITE_URL en el .env: una sola
 * fuente para el nombre y el dominio del sitio.
 */

declare(strict_types=1);

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

require_once __DIR__ . '/config/site.php';
require_once __DIR__ . '/config/database.php';

$siteUrl = Site::url();

$urls = [
	['loc' => $siteUrl . '/', 'priority' => '1.0', 'freq' => 'daily'],
];

try {
	$db = (new Database())->getConnection();

	$stmt = $db->query(
		"SELECT enlace, created_at, updated_at
		 FROM articulos
		 WHERE status = 'publicado' AND deleted_at IS NULL
		 ORDER BY created_at DESC"
	);

	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $art) {
		$lastmod = $art['updated_at'] ?: $art['created_at'];
		$urls[] = [
			'loc'      => $siteUrl . '/' . rawurlencode((string) $art['enlace']),
			'lastmod'  => $lastmod ? date('Y-m-d', strtotime((string) $lastmod)) : null,
			'priority' => '0.8',
			'freq'     => 'weekly',
		];
	}
} catch (Throwable $e) {
	error_log('sitemap.php: ' . $e->getMessage());
	// Se emite el sitemap con lo que se tenga: un sitemap vacío es preferible
	// a un 500 para un rastreador.
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($urls as $u) {
	echo "  <url>\n";
	echo '    <loc>' . htmlspecialchars($u['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";
	if (!empty($u['lastmod'])) {
		echo '    <lastmod>' . htmlspecialchars($u['lastmod'], ENT_XML1, 'UTF-8') . "</lastmod>\n";
	}
	echo '    <changefreq>' . $u['freq'] . "</changefreq>\n";
	echo '    <priority>' . $u['priority'] . "</priority>\n";
	echo "  </url>\n";
}

echo '</urlset>' . "\n";
