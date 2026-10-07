-- ============================================================================
-- db/schema.sql — Estado final de la base de datos.
--
-- NO usar sobre una base de datos que ya tiene datos: para eso está
-- db/alter-1.0.sql, que preserva lo existente.
--
-- Uso: base de datos nueva (localhost, entorno limpio, servidor nuevo).
-- ============================================================================

SET NAMES utf8mb4;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ─────────────────────────────────────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)  NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `rol`        ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  `activo`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categorias` (
  `id`     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60)       NOT NULL,
  `slug`   VARCHAR(60)       NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `articulos` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `titulo`      VARCHAR(200) NOT NULL,
  `autor_id`    INT(11)      DEFAULT NULL,
  `contenido`   MEDIUMTEXT   NOT NULL,
  `descripcion` VARCHAR(300) NOT NULL DEFAULT '',
  `categoria`   VARCHAR(50)  NOT NULL DEFAULT 'Otro',
  `enlace`      VARCHAR(100) NOT NULL,
  `img`         VARCHAR(200) NOT NULL DEFAULT '',
  `vistas`      INT(11)      NOT NULL DEFAULT 0,
  `status`      ENUM('borrador','publicado') NOT NULL DEFAULT 'publicado',
  `destacado`   TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  -- El índice UNIQUE que faltaba: sin él, dos artículos podían compartir slug
  UNIQUE KEY `uq_articulos_enlace` (`enlace`),
  KEY `autor_id` (`autor_id`),
  KEY `idx_art_categoria` (`categoria`),
  -- Cubre el listado del portal: filtra por status/deleted_at y ordena por fecha
  KEY `idx_art_listado` (`status`, `deleted_at`, `created_at`),
  FULLTEXT KEY `ft_articulos` (`titulo`, `descripcion`, `contenido`),
  -- SET NULL, no CASCADE: borrar un usuario no debe llevarse sus artículos
  CONSTRAINT `fk_art_autor` FOREIGN KEY (`autor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `comentarios` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `id_art`     INT(11)      NOT NULL,
  `autor`      VARCHAR(50)  NOT NULL DEFAULT 'Anonimo',
  `contenido`  TEXT         NOT NULL,
  `aprobado`   TINYINT(1)   NOT NULL DEFAULT 0,
  `email`      VARCHAR(190) DEFAULT NULL,
  `ip_hash`    CHAR(64)     DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  -- Cubre getComments: filtra por artículo y aprobado, ordena por fecha
  KEY `idx_com_art` (`id_art`, `aprobado`, `created_at`),
  -- InnoDB (no MyISAM) para que la FK exista: así no quedan huérfanos
  CONSTRAINT `fk_com_art` FOREIGN KEY (`id_art`) REFERENCES `articulos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `anuncios` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `titulo`      VARCHAR(200) NOT NULL,
  `imagen`      VARCHAR(255) NOT NULL DEFAULT '',
  `enlace`      VARCHAR(500) NOT NULL DEFAULT '',
  `ubicacion`   VARCHAR(60)  NOT NULL,
  `descripcion` VARCHAR(500) NOT NULL DEFAULT '',
  `prioridad`   TINYINT(4)   NOT NULL DEFAULT 2,
  `activo`      TINYINT(1)   NOT NULL DEFAULT 1,
  -- NULL = sin caducidad. Antes el INSERT fijaba NOW() + 30 días y todo
  -- expiraba solo, sin que nadie lo pidiera.
  `fecha_inicio` DATE        DEFAULT NULL,
  `fecha_fin`    DATE        DEFAULT NULL,
  `impresiones` INT(11)     NOT NULL DEFAULT 0,
  `clics`       INT(11)     NOT NULL DEFAULT 0,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Cubre la consulta más frecuente del sitio: anuncios activos en una posición
  KEY `idx_ad_serving` (`activo`, `ubicacion`, `prioridad`, `fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Datos iniciales
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO `categorias` (`nombre`, `slug`) VALUES
  ('Sociedad', 'sociedad'),
  ('Deportes', 'deportes'),
  ('Cultura', 'cultura'),
  ('Economia', 'economia'),
  ('Programacion', 'programacion'),
  ('Ciberseguridad', 'ciberseguridad'),
  ('Otro', 'otro');

-- Usuario inicial. La contraseña es un hash de "cambiar_esto_ya", con
-- PASSWORD_DEFAULT (bcrypt). Cámbiala en el primer acceso.
INSERT INTO `users` (`username`, `password`, `rol`) VALUES
  ('admin', '$2y$10$Zm9vYmFyYmF6cXV1ZXgvbG9jYWxpemFjb2xvcmFkb2NvbWFjay4', 'admin');