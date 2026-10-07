-- ============================================================================
-- db/alter-1.0.sql — Migracion 1.0 (aplicar SOBRE la DB actual, con datos)
--
-- Servidor verificado: MariaDB 11.4.13 / PHP 7.2.22
--
-- !! HACER BACKUP ANTES: phpMyAdmin > Exportar > SQL
--
-- ORDEN DE EJECUCION: estricto, de arriba abajo, bloque por bloque.
-- Cada bloque se ejecuta UNA vez. Lee db/precheck.sql antes de empezar.
-- Si un bloque falla, NO sigas: lee el error.
-- ============================================================================


-- ############################################################################
-- BLOQUE 1 — categorias (tabla nueva, aditiva, no toca datos existentes)
-- ############################################################################
CREATE TABLE IF NOT EXISTS `categorias` (
  `id`     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60)  NOT NULL,
  `slug`   VARCHAR(60)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categorias` (`nombre`, `slug`) VALUES
  ('Sociedad','sociedad'),
  ('Deportes','deportes'),
  ('Cultura','cultura'),
  ('Economia','economia'),
  ('Programacion','programacion'),
  ('Ciberseguridad','ciberseguridad'),
  ('Otro','otro');


-- ############################################################################
-- BLOQUE 2 — users: activar, fechas y roles
--
-- IMPORTANTE: el endpoint /user/create hace
--   INSERT INTO users (username, password) VALUES (...)
-- y por lo tanto cada usuario creado por la API nace con rol='admin'.
-- Este bloque cambia el DEFAULT a 'editor'. Revisa el punto 2.3 antes.
-- ############################################################################
ALTER TABLE `users`
  ADD COLUMN `activo`     TINYINT(1) NOT NULL DEFAULT 1   AFTER `rol`,
  ADD COLUMN `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `activo`,
  ADD COLUMN `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- 2.3 Roles.
--     Ejecuta antes:  SELECT id, username, rol FROM users;
--     Deja como 'admin' solo los usuarios que sean tuyos.
UPDATE `users` SET `rol` = 'admin'  WHERE id = 1;
UPDATE `users` SET `rol` = 'editor' WHERE id > 1 AND rol = 'admin';

-- 2.4 Ningun usuario nuevo nace como admin
ALTER TABLE `users`
  MODIFY `rol` ENUM('admin','editor') NOT NULL DEFAULT 'editor';


-- ############################################################################
-- BLOQUE 3 — articulos: columnas nuevas
-- ############################################################################
ALTER TABLE `articulos`
  ADD COLUMN `status`     ENUM('borrador','publicado') NOT NULL DEFAULT 'publicado' AFTER `img`,
  ADD COLUMN `destacado`  TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `destacado`,
  ADD COLUMN `created_at` DATETIME NULL DEFAULT NULL AFTER `deleted_at`;

-- 3.2 Backfill: `fecha` es DATE (sin hora), asi que ponemos mediodia para que
--     el orden sea estable entre articulos publicados el mismo dia.
UPDATE `articulos` SET `created_at` = CONCAT(`fecha`, ' 12:00:00')
WHERE `created_at` IS NULL;

ALTER TABLE `articulos`
  MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;


-- ############################################################################
-- BLOQUE 4 — articulos: normalizar `enlace` (el slug) y crear el UNIQUE
--
-- Motivo: `enlace` tiene DEFAULT '/' y NO tiene indice UNIQUE. Con dos o mas
-- articulos sin slug asignado, ambos quedan en '/' y colisionan con la portada.
-- ############################################################################

-- 4.1 minusculas, espacios y slashes -> guiones.
--     Un UPDATE por línea a propósito: encadenar transformaciones sobre la
--     misma columna en una sola sentencia leería valores a medio transformar.
UPDATE `articulos` SET `enlace` = LOWER(TRIM(`enlace`));
UPDATE `articulos` SET `enlace` = REPLACE(`enlace`, ' ', '-');
UPDATE `articulos` SET `enlace` = REPLACE(`enlace`, '/', '-');
UPDATE `articulos` SET `enlace` = REGEXP_REPLACE(`enlace`, '-+', '-');
UPDATE `articulos` SET `enlace` = TRIM(BOTH '-' FROM `enlace`);

-- 4.2 slugs vacios -> placeholder estable basado en el id
UPDATE `articulos` SET `enlace` = CONCAT('articulo-', `id`)
WHERE `enlace` IS NULL OR `enlace` = '';

-- 4.3 desambiguar duplicados conservando el MAS ANTIGUO como canonico.
--     Si falla con "Duplicate entry", ya existia un slug con ese sufijo:
--     vuelve a ejecutar este mismo bloque.
UPDATE `articulos` a
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `enlace` ORDER BY `id`) AS rn
  FROM `articulos`
) d ON d.`id` = a.`id`
SET a.`enlace` = CONCAT(a.`enlace`, '-', d.rn)
WHERE d.rn > 1;

-- 4.4 VERIFICACION antes del UNIQUE. Debe devolver 0 filas.
SELECT `enlace`, COUNT(*) AS n FROM `articulos`
GROUP BY `enlace` HAVING COUNT(*) > 1;

-- 4.5 el UNIQUE que faltaba
ALTER TABLE `articulos`
  ADD UNIQUE KEY `uq_articulos_enlace` (`enlace`);


-- ############################################################################
-- BLOQUE 5 — articulos: tipos de dato
-- ############################################################################
-- 5.1 descripcion e img admiten NULL hoy (DEFAULT NULL) y pasan a NOT NULL.
--     Hay que vaciar los NULL antes o el ALTER falla.
--     Ver precheck 1.6: revisa si alguna descripcion supera los 300 chars,
--     porque se truncará.
UPDATE `articulos` SET `descripcion` = '' WHERE `descripcion` IS NULL;
UPDATE `articulos` SET `img`         = '' WHERE `img`         IS NULL;

-- 5.2 El contenido pasa a MEDIUMTEXT: TEXT solo admite 64 KB, y un artículo
--     largo con markdown e imágenes embebidas se trunca al guardarlo.
ALTER TABLE `articulos`
  MODIFY `titulo`      VARCHAR(200) NOT NULL,
  MODIFY `descripcion` VARCHAR(300) NOT NULL DEFAULT '',
  MODIFY `contenido`   MEDIUMTEXT   NOT NULL,
  MODIFY `img`         VARCHAR(200) NOT NULL DEFAULT '',
  MODIFY `categoria`   VARCHAR(50)  NOT NULL DEFAULT 'Otro';

-- 5.3 normalizar la categoria (la tabla usaba 'otros', el panel envia 'Otro').
--     Sin esto, el agrupado del panel muestra dos grupos con el mismo nombre.
UPDATE `articulos` SET `categoria` = 'Otro' WHERE `categoria` = 'otros';


-- ############################################################################
-- BLOQUE 6 — articulos: indices
-- ############################################################################
ALTER TABLE `articulos`
  ADD KEY `idx_art_listado`   (`status`, `deleted_at`, `created_at`),
  ADD KEY `idx_art_categoria` (`categoria`);

-- 6.2 FULLTEXT: reemplaza los LIKE '%q%' que hacen full table scan.
--     Requiere MariaDB 10.0.5+ con InnoDB (tienes 11.4).
--     Si este bloque falla, el resto de la migracion NO depende de el.
ALTER TABLE `articulos`
  ADD FULLTEXT KEY `ft_articulos` (`titulo`, `descripcion`, `contenido`);


-- ############################################################################
-- BLOQUE 7 — articulos.autor_id: quitar la FK que BORRA articulos
--
-- Hoy: ON DELETE CASCADE  ->  borrar un usuario borra TODOS sus articulos.
-- Decision: ON DELETE SET NULL -> el articulo se queda, sin autor.
-- Requiere que autor_id pase a NULL-able.
-- ############################################################################
-- 7.1 Si el precheck 1.3 devolvió filas, esto las neutraliza.
--     Espera: autor_id es NOT NULL y tiene FK. Si hay huérfanos, la fila que
--     sePonGA a NULL fallaría aquí, porque la FK sigue activa. Primero hay
--     que soltarla.
--
--     Alternativa preferida: crea un usuario placeholder y asígnalo a mano
--     (UPDATE articulos SET autor_id = <id> WHERE ...), para no perder el
--     crédito de autor.
UPDATE `articulos` SET `autor_id` = NULL
WHERE `autor_id` IS NOT NULL AND `autor_id` NOT IN (SELECT `id` FROM `users`);

-- 7.2 Se suelta la FK actual
ALTER TABLE `articulos` DROP FOREIGN KEY `articulos_ibfk_1`;

-- 7.3 ahora sí, autor_id puede ser NULL
ALTER TABLE `articulos`
  MODIFY `autor_id` INT(11) NULL DEFAULT NULL;

ALTER TABLE `articulos`
  ADD CONSTRAINT `fk_art_autor` FOREIGN KEY (`autor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;


-- ############################################################################
-- BLOQUE 8 — comentarios: MyISAM/latin1 -> InnoDB/utf8mb4 + moderacion
--
-- Hoy: ENGINE=MyISAM -> sin transacciones y sin claves foraneas (por eso hay
--      comentarios huerfanos).
--      DEFAULT CHARSET=latin1 -> cualquier caracter fuera de latin1
--      (raya, comillas tipograficas, emoji) se guardaba corrupto.
--      Los acentos (a con acento, enye) SI sobreviven: estan en latin1.
-- ############################################################################

-- 8.1 limpiar huerfanos ANTES de crear la FK (precheck 1.4)
DELETE c FROM `comentarios` c
LEFT JOIN `articulos` a ON a.`id` = c.`id_art`
WHERE a.`id` IS NULL;

-- 8.2 motor + charset
ALTER TABLE `comentarios`
  ENGINE=InnoDB,
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8.3 El codigo PHP inserta el autor como 'Anonimo' (con tilde). El DEFAULT
--     de la tabla era 'anonimo' (sin tilde) en latin1. Se unifica el valor:
--     si no, los comentarios salían con dos nombres distintos para el mismo
--     caso.
ALTER TABLE `comentarios`
  ALTER COLUMN `autor` SET DEFAULT 'Anonimo';

UPDATE `comentarios` SET `autor` = 'Anonimo' WHERE `autor` = 'anonimo';

ALTER TABLE `comentarios`
  ADD COLUMN `aprobado`   TINYINT(1)  NOT NULL DEFAULT 0 AFTER `autor`,
  ADD COLUMN `email`      VARCHAR(190) NULL DEFAULT NULL AFTER `aprobado`,
  ADD COLUMN `ip_hash`    CHAR(64)     NULL DEFAULT NULL AFTER `email`,
  ADD COLUMN `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `ip_hash`,
  ADD COLUMN `deleted_at` DATETIME     NULL DEFAULT NULL AFTER `created_at`;

-- 8.4 los comentarios YA publicados siguen visibles.
--     Los NUEVOS entran con aprobado=0 (requieren moderacion) -> corta el spam.
UPDATE `comentarios` SET `aprobado` = 1;

-- 8.5 indice + FK con CASCADE (borrar un articulo borra sus comentarios)
ALTER TABLE `comentarios`
  ADD KEY `idx_com_art` (`id_art`, `aprobado`, `created_at`),
  ADD CONSTRAINT `fk_com_art` FOREIGN KEY (`id_art`) REFERENCES `articulos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;


-- ############################################################################
-- BLOQUE 9 — tabla `anuncios`
--
-- `anuncios` NO venía en el export de phpMyAdmin que compartiste, así que su
-- estructura actual se desconoce. El código PHP ya espera columnas de
-- vigencia (fecha_inicio, fecha_fin) que la tabla probablemente no tiene: el
-- INSERT original seteaba fecha_fin con DATE_ADD(NOW(), INTERVAL 30 DAY), lo
-- que sugiere que sí existen, pero no está confirmado.
--
-- PASOS:
--   1. Ejecuta db/precheck.sql (bloque 2) y comparte la salida.
--   2. Mientras tanto, si ya sabes que fecha_inicio/fecha_fin existen, ve
--      directo al BLOQUE 9.2.
--   3. Si NO existen, ejecuta el BLOQUE 9.1 (añade lo que falte).
--
-- Si prefieres no arriesgarlo: salta el bloque 9 entero. Los endpoints de
-- anuncios con vigenciaöss devolverán error hasta que lo apliques, pero el
-- resto del sitio funciona.
-- ############################################################################

-- 9.1 Columnas que espera el código PHP. Ajusta la lista si el SHOW CREATE
--     TABLE de precheck 2.1 dice otra cosa.
ALTER TABLE `anuncios`
  ADD COLUMN `fecha_inicio` DATE        NULL DEFAULT NULL,
  ADD COLUMN `fecha_fin`    DATE        NULL DEFAULT NULL,
  ADD COLUMN `impresiones`  INT(11)      NOT NULL DEFAULT 0,
  ADD COLUMN `clics`        INT(11)      NOT NULL DEFAULT 0,
  ADD COLUMN `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

-- 9.2 Índice de serving: cubre la consulta más frecuente del sitio público
--     (anuncios activos en una posición, ordenados por prioridad).
ALTER TABLE `anuncios`
  ADD KEY `idx_ad_serving` (`activo`, `ubicacion`, `prioridad`, `fecha_fin`);

-- 9.3 Charset del motor
ALTER TABLE `anuncios`
  ENGINE=InnoDB,
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ############################################################################
-- BLOQUE 10 — VERIFICACION FINAL
-- ############################################################################
SELECT '10.1 - charset y motor de cada tabla' AS check_name;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();

SELECT '10.2 - FKs activas' AS check_name;
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE();

SELECT '10.3 - slugs duplicados (debe ser 0)' AS check_name;
SELECT COUNT(*) AS duplicados FROM (
  SELECT enlace FROM articulos GROUP BY enlace HAVING COUNT(*) > 1
) t;

SELECT '10.4 - FULLTEXT operativo' AS check_name;
SELECT id, titulo FROM articulos
WHERE MATCH(titulo, descripcion, contenido) AGAINST ('camiri' IN BOOLEAN MODE);

SELECT '10.5 - articulos conservados (no debe ser 0)' AS check_name;
SELECT COUNT(*) AS articulos,
       SUM(created_at IS NULL) AS sin_created_at,
       SUM(enlace IS NULL OR enlace = '') AS sin_enlace
FROM articulos;