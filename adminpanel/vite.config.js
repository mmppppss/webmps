import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

/** Directorio del panel: funciona igual en ESM (Node) y en el bundle de Vite. */
const dirPanel = path.dirname(fileURLToPath(import.meta.url))

/** Identidad: la misma site.config.json del sitio público (fuente única). */
const site = JSON.parse(
  fs.readFileSync(path.join(dirPanel, '..', 'site.config.json'), 'utf8')
)

/** El <title> lo inserta Vite sin escapar, así que va escapado aquí. */
const escaparTexto = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/** Inyecta lang y título desde site.config.json (nada hardcodeado en HTML). */
function metasSitio(cfg) {
  return {
    name: 'metas-sitio',
    transformIndexHtml(html) {
      return {
        html: html.replace(
          /<html lang="[^"]*">/,
          `<html lang="${cfg.idioma || 'es'}">`
        ),
        tags: [
          {
            tag: 'title',
            children: escaparTexto(`Panel · ${cfg.nombre || ''}`),
            injectTo: 'head',
          },
        ],
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const raiz = loadEnv(mode, '..', '')
  const panel = loadEnv(mode, dirPanel, '')

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
    plugins: [preact(), tailwindcss(), metasSitio(site)],
    base: './',
    define: {
      'import.meta.env.VITE_APP_API_URL': JSON.stringify(apiUrl),
    },
  }
})
