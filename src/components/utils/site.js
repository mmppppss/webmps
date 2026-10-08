import site from '@site';

/**
 * Identidad del sitio, leída de site.config.json (raíz del proyecto).
 *
 * Ese archivo es la única fuente de verdad: lo leen también el PHP para el SEO
 * y el sitemap. Antes el nombre estaba duplicado en .env, api/.env y
 * src/config.json, y era fácil que el SEO acabara publicando un nombre
 * distinto del que se veía en pantalla.
 *
 * Uso:
 *   import { useSite } from './utils/site'
 *   const site = useSite()
 *   <title>{site.titulo}</title>
 */
export const configSitio = site;

export function useSite() {
	return site;
}

/** URL absoluta de una ruta del proyecto. Acepta '/media/x.webp' o 'x.webp'. */
export function urlAbsoluta(ruta) {
	if (!ruta) return site.imagenPorDefecto;
	if (/^https?:\/\//.test(ruta)) return ruta;
	return `${site.url}/${String(ruta).replace(/^\/+/, '')}`;
}

/** Título completo de una página: "Artículo | mmppppss". */
export function tituloPagina(titulo) {
	if (!titulo) return site.titulo;
	return `${titulo} | ${site.nombre}`;
}
