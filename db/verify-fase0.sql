-- ============================================================================
-- db/verify-fase0.sql — Comprobaciones tras aplicar alter-1.0.sql
--
-- Todas las consultas son de solo lectura. Pégalas en phpMyAdmin después de
-- la migración. Cada una debería devolver lo indicado en el comentario.
-- ============================================================================

SELECT '1. MOTOR Y CHARSET: comentarios debe ser InnoDB + utf8mb4' AS verificacion;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();

SELECT '2. FKs: fk_com_art=CASCADE, fk_art_autor=SET NULL' AS verificacion;
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE();

SELECT '3. SLUGS DUPLICADOS: debe devolver 0' AS verificacion;
SELECT COUNT(*) AS duplicados FROM (
  SELECT enlace FROM articulos GROUP BY enlace HAVING COUNT(*) > 1
) t;

SELECT '4. SLUGS VACIOS: debe devolver 0' AS verificacion;
SELECT COUNT(*) AS vacios FROM articulos
WHERE enlace IS NULL OR TRIM(enlace) = '' OR enlace = '/';

SELECT '5. INDICE UNIQUE DE ENLACE: debe existir' AS verificacion;
SHOW INDEX FROM articulos WHERE Key_name = 'uq_articulos_enlace';

SELECT '6. FULLTEXT: debe devolver filas si hay articulos sobre Camiri' AS verificacion;
SELECT id, titulo FROM articulos
WHERE MATCH(titulo, descripcion, contenido) AGAINST ('camiri' IN BOOLEAN MODE);

SELECT '7. CATEGORIAS: deben existir las 7 iniciales' AS verificacion;
SELECT c.id, c.nombre, c.slug, COUNT(a.id) AS articulos
FROM categorias c
LEFT JOIN articulos a ON a.categoria = c.nombre AND a.deleted_at IS NULL
GROUP BY c.id, c.nombre, c.slug ORDER BY c.nombre;

SELECT '8. USUARIOS: solo el tuyo debe ser admin' AS verificacion;
SELECT id, username, rol, activo, created_at FROM users ORDER BY id;

SELECT '9. ARTICULOS: resumen por estado' AS verificacion;
SELECT status, COUNT(*) AS n, SUM(deleted_at IS NOT NULL) AS borrados
FROM articulos GROUP BY status;

SELECT '10. DESCRIPCIONES TRUNCADAS: revisa si hay alguna pegada al limite' AS verificacion;
SELECT id, titulo, CHAR_LENGTH(descripcion) AS len
FROM articulos WHERE CHAR_LENGTH(descripcion) >= 300;

SELECT '11. FECHAS: created_at debe estar informado en todos' AS verificacion;
SELECT COUNT(*) AS sin_fecha FROM articulos WHERE created_at IS NULL;

SELECT '12. MODERACION: comentarios pendientes (aprobado=0)' AS verificacion;
SELECT COUNT(*) AS pendientes FROM comentarios WHERE aprobado = 0;

SELECT '13. ANUNCIOS: la tabla debe tener las columnas que usa el codigo' AS verificacion;
SHOW COLUMNS FROM anuncios;

SELECT '14. CATEGORIAS SIN ARTICULOS: se pueden eliminar sin riesgo' AS verificacion;
SELECT c.nombre FROM categorias c
LEFT JOIN articulos a ON a.categoria = c.nombre AND a.deleted_at IS NULL
WHERE a.id IS NULL;

SELECT '15. COMENTARIOS PENDIENTES: aprobar con UPDATE comentarios SET aprobado=1' AS verificacion;
SELECT id, id_art, autor, LEFT(contenido, 60) AS extracto, created_at
FROM comentarios WHERE aprobado = 0 ORDER BY created_at DESC LIMIT 20;

SELECT '16. INTEGRIDAD: articulos sin autor tras el bloque 7' AS verificacion;
SELECT id, titulo FROM articulos WHERE autor_id IS NULL;