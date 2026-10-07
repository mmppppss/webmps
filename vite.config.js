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
 */
const site = JSON.parse(fs.readFileSync('./site.config.json', 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],

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
