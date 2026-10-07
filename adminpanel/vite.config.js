import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

/**
 * El panel necesita su propia URL de API, distinta de la del sitio público:
 * en desarrollo apunta a http://localhost:3000, y en producción al dominio real.
 *
 * Prioridad de configuración:
 *   1. adminpanel/.env           (local, gitignored)
 *   2. ../.env del repo raíz     (compartido con el sitio público)
 *
 * Sin este bloque, `import.meta.env.VITE_APP_API_URL` llegaba como undefined y
 * todas las peticiones iban a "undefined/login".
 */
export default defineConfig(({ mode }) => {
  const raiz = loadEnv(mode, '..', '')
  const panel = loadEnv(mode, __dirname, '')

  const apiUrl = panel.VITE_APP_API_URL || raiz.VITE_APP_API_URL || ''

  if (!apiUrl) {
    throw new Error(
      'Falta VITE_APP_API_URL.\n' +
      'Crea adminpanel/.env con:\n' +
      '  VITE_APP_API_URL=http://localhost:3000/api/public/index.php'
    )
  }

  if (apiUrl.includes('rf.gd') && mode !== 'production') {
    console.warn(
      '\n  AVISO: el panel está apuntando a PRODUCCIÓN (' + apiUrl + ').\n' +
      '  Crea adminpanel/.env con la URL local para no publicar a la DB real.\n'
    )
  }

  return {
    plugins: [preact(), tailwindcss()],
    base: './',
    define: {
      'import.meta.env.VITE_APP_API_URL': JSON.stringify(apiUrl),
    },
  }
})