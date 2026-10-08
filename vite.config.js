import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'

/**
 * site.config.json es la ÚNICA fuente de identidad del sitio.
 *
 * Antes el nombre, el título y las keywords vivían duplicados en cuatro
 * sitios (src/config.json, .env, api/.env y literales en el PHP), así que
 * cambiar el nombre del sitio obligaba a editar varios archivos y era fácil
 * que el SEO acabara publicando un nombre distinto del que mostraba la web.
 *
 * Ahora:
 *   - el frontend lo lee por `import site from '../../site.config.json'`
 *   - el PHP lo lee en tiempo de ejecución (api/config/site.php)
 *   - index.html no escribe ningún nombre: este plugin lo inyecta desde la
 *     propia configuración (ver `metasSitio`).
 */
const site = JSON.parse(fs.readFileSync('./site.config.json', 'utf8'))

/** Escapa texto para ir dentro de un elemento HTML (el <title> va como
 *  `children` y Vite lo inserta tal cual; los atributos los escapa Vite). */
const escaparTexto = (valor) =>
	String(valor ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')

/**
 * Inyecta las metas de identidad en index.html.
 *
 * Vite escapa los atributos por nosotros (serializeAttrs → escape-html),
 * así que los valores van en crudo; solo el contenido del <title> se
 * escapa aquí.
 */
function metasSitio(cfg) {
	const nombre = cfg.nombre || ''
	const titulo = cfg.titulo || nombre
	const descripcion = cfg.descripcion || ''
	const url = String(cfg.url || '').replace(/\/+$/, '')
	const imagen = cfg.imagenPorDefecto
		? url + '/' + String(cfg.imagenPorDefecto).replace(/^\/+/, '')
		: ''

	const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' })

	return {
		name: 'metas-sitio',
		transformIndexHtml(html) {
			return {
				html: html.replace(
					/<html lang="[^"]*">/,
					`<html lang="${cfg.idioma || 'es'}">`
				),
				tags: [
					{ tag: 'title', children: escaparTexto(titulo), injectTo: 'head' },
					meta({ name: 'description', content: descripcion }),
					meta({ name: 'robots', content: 'index, follow' }),
					cfg.themeColor && meta({ name: 'theme-color', content: cfg.themeColor }),
					meta({ property: 'og:site_name', content: nombre }),
					meta({ property: 'og:title', content: titulo }),
					meta({ property: 'og:description', content: descripcion }),
					meta({ property: 'og:type', content: 'website' }),
					meta({ property: 'og:locale', content: cfg.locale || cfg.idioma || 'es' }),
					imagen && meta({ property: 'og:image', content: imagen }),
					meta({ name: 'twitter:card', content: 'summary_large_image' }),
					cfg.favicon && {
						tag: 'link',
						attrs: { rel: 'icon', href: cfg.favicon },
						injectTo: 'head',
					},
				].filter(Boolean),
			}
		},
	}
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react(), metasSitio(site)],

    resolve: {
      alias: {
        // Import directo desde cualquier profundidad del árbol
        '@site': new URL('./site.config.json', import.meta.url).pathname,
      },
    },

    build: {
      // El manifiesto lo lee api/index.php para localizar el bundle en vez de
      // tener el hash escrito a mano en el HTML.
      manifest: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    define: {
      // Se mantiene por compatibilidad con Menu.jsx y por si algún
      // componente lee import.meta.env directamente.
      'import.meta.env.VITE_SITE_NAME': JSON.stringify(site.nombre),
      'import.meta.env.VITE_SITE_TITLE': JSON.stringify(site.titulo),
      'import.meta.env.VITE_SITE_DESCRIPTION': JSON.stringify(site.descripcion),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(site.url),
      'import.meta.env.VITE_SITE_TWITTER': JSON.stringify(site.twitter),
      'import.meta.env.VITE_SITE_KEYWORDS': JSON.stringify(site.keywords),
    },
  }
})
