# 📰 mmppppss

Medio digital local de **Camiri, Bolivia**: noticias, anuncios y deporte.

- **Sitio público:** https://mmppppss.rf.gd
- **Panel de administración:** `/panel/`

---

## 🚀 Características

- 🌐 Sitio ligero con diseño minimalista y responsive.
- 📰 Artículos en Markdown con vista previa, categorías y búsqueda.
- 💬 Comentarios con moderación previa.
- 📣 Anuncios locales con ubicación, prioridad y vigencias configurables.
- 🗂️ Categorías gestionables desde el panel, almacenadas en la base de datos.
- 🔎 SEO por artículo con Open Graph, Twitter Card, JSON-LD y `sitemap.xml`.
- 🖼️ Subida de imágenes convertidas a WebP en el servidor.

---

## ⚙️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend público | React 19 + Vite 7 |
| Panel | Preact + Vite 6 + Tailwind 4 |
| Backend | PHP 7.2+ (API REST enrutada a mano) |
| Base de datos | MariaDB 11 / MySQL |

---

## 📁 Estructura

```
.
├── api/                    Backend PHP
│   ├── index.php           SEO por artículo (Open Graph, 404 real)
│   ├── public/index.php    Punto de entrada de la API
│   ├── routes/web.php      Enrutado
│   ├── controllers/        Article, Ad, Auth, Category
│   ├── models/             Article, Ad, User, Category
│   ├── config/             database.php, middleware.php
│   ├── storage/            Rate limiting (bloqueado por .htaccess)
│   └── sitemap.php
├── adminpanel/             Panel Preact
├── src/                    Sitio público React
├── db/                     Schema, migraciones y verificación
├── media/                  Imágenes (generado en runtime, no versionado)
├── .htaccess               Reescritura de URLs, caché y cabeceras
└── robots.txt
```

---

## 🛠️ Puesta en marcha

### 1. Sitio público

```bash
pnpm install
cp .env.example .env      # ajusta VITE_APP_API_URL
pnpm dev                  # http://localhost:5173
pnpm build                # genera dist/
```

### 2. Panel de administración

```bash
cd adminpanel
pnpm install
pnpm dev                  # http://localhost:5174
pnpm build                # genera dist/, se publica en /panel/
```

### 3. API

Copia `api/.env.example` a `api/.env` y rellena las credenciales. Consulta
`db/README.md` para el procedimiento de base de datos.

```ini
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
API_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
COMMENT_HASH_SECRET=<cadena aleatoria larga>
```

Genera el secreto con:

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

---

## 🗄️ Base de datos

El procedimiento completo está en **[`db/README.md`](db/README.md)**.

Resumen:

1. **Backup** desde phpMyAdmin → Exportar. No es opcional.
2. Diagnóstico con `db/precheck.sql` (solo lectura).
3. Migración con `db/alter-1.0.sql`, bloque por bloque y en orden.
4. Verificación con `db/verify-fase0.sql`.

`db/schema.sql` crea una base de datos **nueva** desde cero. No lo apliques
sobre la base actual: para eso está `alter-1.0.sql`.

---

## 🔌 API

Todas las rutas cuelgan de `/api/public/index.php/`.

### Público

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/arts` | Artículos publicados (sin `contenido`) |
| `GET` | `/arts?page=1&per_page=20` | Listado paginado |
| `GET` | `/arts/grouped` | Categorías con su total |
| `GET` | `/last` | Último artículo publicado |
| `GET` | `/art/{slug}` | Artículo por slug |
| `GET` | `/art/id/{id}` | Artículo por id |
| `GET` | `/art/search/{término}` | Búsqueda (FULLTEXT) |
| `GET` | `/art/rel/{slug}` | Relacionados por categoría |
| `GET` | `/art/comments/{id}` | Comentarios aprobados |
| `POST` | `/art/comments/{id}` | Enviar comentario (queda pendiente) |
| `GET` | `/categorias` | Categorías |
| `GET` | `/ad` | Anuncios |
| `GET` | `/ad/random` | Anuncio aleatorio |
| `GET` | `/ad/random/{ubicación}` | Aleatorio por ubicación |
| `GET` | `/ad/location/{ubicación}` | Anuncios de una ubicación |

### Requiere sesión

| Método | Ruta | Rol |
|---|---|---|
| `POST` | `/login` | — |
| `POST` | `/logout` | — |
| `GET` | `/is-auth` | — |
| `GET` | `/admin/arts` | cualquiera |
| `POST` | `/art/create` | cualquiera |
| `POST` | `/art/update/{id}` | cualquiera |
| `POST` | `/art/delete/{id}` | cualquiera |
| `POST` | `/upload/img` | cualquiera |
| `GET` | `/imgs` | cualquiera |
| `POST` | `/ad/create` · `/ad/update/{id}` · `/ad/toggle/{id}` · `/ad/delete/{id}` | cualquiera |
| `POST` | `/categorias` | **admin** |
| `PUT` | `/categorias/{id}` | **admin** |
| `DELETE` | `/categorias/{id}` | **admin** |
| `POST` | `/user/create` | **admin** |

La autenticación es por cookie de sesión (`webmps_sess`, `HttpOnly`,
`SameSite=Lax`). El login tiene límite de 5 intentos en 15 minutos.

---

## 🔐 Seguridad

- **Todas las rutas de escritura exigen sesión.** Antes, `requireAuth()`
  devolvía `false` sin terminar la ejecución, de modo que cualquier visitante
  podía borrar artículos sin autenticarse.
- **Los modelos no exponen rutas del sistema de archivos.** El endpoint
  `/imgs` devuelve solo nombre, URL, tamaño y fecha.
- **Subida de imágenes validada**: MIME real por contenido, límite de 8 MB,
  `getimagesize()` y conversión a WebP en el servidor.
- **Contraseñas** con `password_hash`/`password_verify`, rehash automático y
  longitud mínima de 8 caracteres.
- **Comentarios moderados**: se guardan con `aprobado = 0` y el hash del IP
  (nunca la IP en claro). Hay límite de frecuencia.
- **`api/` bloqueado por `.htaccess`**: los modelos, controladores y el `.env`
  no son accesibles por URL.
- **Borrado lógico** de artículos: se marcan con `deleted_at`.

---

## 🎨 Marca

- Celeste principal `#4fc3f7`
- Celeste oscuro `#0288d1`
- Blanco `#ffffff`
- Texto `#1a1a1a`

`src/config.json` es la fuente de verdad de la identidad del sitio. Los
valores `VITE_SITE_*` de `.env` y los `SITE_*` de `api/.env` deben coincidir
con ese archivo, o el SEO publicará un nombre distinto al que muestra la app.

---

## 📄 Licencia

Contenido bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).