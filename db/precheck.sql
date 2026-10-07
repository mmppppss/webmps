-- ============================================================================
-- db/precheck.sql — Diagnóstico de solo LECTURA
-- Ejecutar ANTES de db/alter-1.0.sql. No modifica nada.
-- Objetivo: decidir qué bloques de la migración son seguros aplicar.
-- ============================================================================

SELECT '1.1 - Duplicados en articulos.enlace' AS check_name;
SELECT enlace, COUNT(*) AS n, GROUP_CONCAT(id) AS ids
FROM articulos GROUP BY enlace HAVING COUNT(*) > 1;

SELECT '1.2 - articulos con enlace vacio o "/" (rompen el ruteo)' AS check_name;
SELECT id, titulo, enlace FROM articulos
WHERE enlace IS NULL OR TRIM(enlace) = '' OR enlace = '/' OR enlace LIKE '%/%';

SELECT '1.3 - articulos.autor_id huerfano (bloquea la FK)' AS check_name;
SELECT a.id, a.titulo, a.autor_id
FROM articulos a LEFT JOIN users u ON u.id = a.autor_id
WHERE u.id IS NULL;

SELECT '1.4 - comentarios.id_art huerfano (se borraran en la migracion)' AS check_name;
SELECT c.id, c.id_art, c.autor
FROM comentarios c LEFT JOIN articulos a ON a.id = c.id_art
WHERE a.id IS NULL;

-- La tabla comentarios está en latin1. Estos caracteres NUNCA pudieron
-- guardarse bien porque no existen en latin1. Si salen filas, ese texto está
-- corrupto y hay que corregirlo a mano antes del bloque 8.
SELECT '1.5 - comentarios con caracteres rotos (guion, comillas, emoji)' AS check_name;
SELECT id, autor, contenido FROM comentarios
WHERE autor   REGEXP '[–—“”‘’…]'
   OR contenido REGEXP '[–—“”‘’…]'
LIMIT 20;

-- Comparte cuántos comentarios tienen texto en latin1 válido.
SELECT '1.5b - volumen total de comentarios' AS check_name;
SELECT COUNT(*) AS total, SUM(contenido = '') AS vacios FROM comentarios;

SELECT '1.6 - articulos.descripcion > 300 chars (se truncara en la migracion)' AS check_name;
SELECT id, titulo, CHAR_LENGTH(descripcion) AS len
FROM articulos WHERE CHAR_LENGTH(descripcion) > 300;

SELECT '1.7 - categorias inconsistentes (minuscula vs mayuscula)' AS check_name;
SELECT categoria, COUNT(*) AS n FROM articulos GROUP BY categoria ORDER BY categoria;

SELECT '1.8 - usuarios y su rol actual' AS check_name;
SELECT id, username, rol FROM users ORDER BY id;

SELECT '1.9 - usuarios admin creados por /user/create (rol default)' AS check_name;
SELECT COUNT(*) AS total_admins FROM users WHERE rol = 'admin';

SELECT '1.10 - volumen actual (para estimar FULLTEXT)' AS check_name;
SELECT
  (SELECT COUNT(*) FROM articulos)  AS articulos,
  (SELECT COUNT(*) FROM comentarios) AS comentarios,
  (SELECT COUNT(*) FROM users)       AS users;

SELECT '1.11 - indices actuales de articulos' AS check_name;
SHOW INDEX FROM articulos;

-- ###########################################################################
-- 2. BLOQUE 6 — tabla `anuncios`
--
-- IMPORTANTE: `anuncios` NO venía en el export que compartiste. Antes de
-- aplicar la migración, ejecuta estas consultas y comparte la salida.
--
-- El código PHP (api/models/Ad.php) ya usa columnas que la tabla actual
-- probablemente NO tiene: fecha_inicio, fecha_fin, impresiones, clics,
-- updated_at. Si tu tabla no las tiene, los endpoints de anuncios fallarán
-- con "Unknown column". Este bloque añade las que falten.
-- ###########################################################################

SELECT '2.1 - estructura actual de anuncios' AS check_name;
SHOW CREATE TABLE anuncios;

SELECT '2.2 - volumen de anuncios' AS check_name;
SELECT COUNT(*) AS anuncios FROM anuncios;

SELECT '2.3 - columnas que usa el codigo PHP' AS check_name;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'anuncios'
ORDER BY ORDINAL_POSITION;

SELECT '2.4 - fechas: valores fuera de rango' AS check_name;
SELECT id, fecha_inicio, fecha_fin,
       DATEDIFF(COALESCE(fecha_fin, CURDATE()), fecha_inicio) AS dias
FROM anuncios
WHERE fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL
ORDER BY dias;

SELECT '2.5 - ubicaciones usadas (deben estar en la lista de AdController)' AS check_name;
SELECT ubicacion, COUNT(*) AS n FROM anuncios GROUP BY ubicacion;

SELECT '2.6 - prioridades fuera de 1..3' AS check_name;
SELECT id, titulo, prioridad FROM anuncios
WHERE prioridad IS NULL OR prioridad NOT IN (1, 2, 3);