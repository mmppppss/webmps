# Base de datos

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `precheck.sql` | Diagnóstico de solo lectura. **Ejecútalo primero.** |
| `alter-1.0.sql` | Migración incremental sobre la DB actual. **Preserva los datos.** |
| `schema.sql` | Estado final. Para crear una DB nueva desde cero. |
| `data.sql` | Datos iniciales. Se genera tras migrar la DB real. |

## Procedimiento

### 1. Backup (no negociable)

phpMyAdmin → seleccionar la base → **Exportar** → método *Rápido* → **Continuir**.
Guarda el `.sql` antes de tocar nada.

### 2. Diagnóstico

phpMyAdmin → pestaña **SQL** → pega `precheck.sql` → Ejecutar.

Revisa en especial:

- **1.1** duplicados en `articulos.enlace` → si hay filas, el bloque 4.3 los resuelve
- **1.3** artículos con `autor_id` inexistente → el bloque 7.1 los neutraliza
- **1.4** comentarios huérfanos → el bloque 8.1 los **borra** (no hay recuperación)
- **1.6** descripciones de más de 300 caracteres → se truncarán en el bloque 5

### 3. Migración

Pega `alter-1.0.sql` en la pestaña SQL y ejecuta **bloque por bloque**, en orden.

Si un bloque falla, **no sigas**. El script está escrito para que puedas
reintentarlo: los `ALTER` son idempotentes solo la primera vez, así que anota
cuáles completaste.

### 4. Verificación

El bloque 9 comprueba todo. Debe mostrar:

- `comentarios` en **InnoDB** y **utf8mb4** (ya no MyISAM ni latin1)
- FK `fk_com_art` con `DELETE_RULE = CASCADE`
- FK `fk_art_autor` con `DELETE_RULE = SET NULL`
- `duplicados = 0`
- FULLTEXT devolviendo filas

## Qué hace cada bloque

| Bloque | Cambio | Riesgo |
|---|---|---|
| 1 | Tabla `categorias` + 7 categorías iniciales | Ninguno |
| 2 | `users`: `activo`, fechas, `rol` por defecto `editor` | Revisar el 2.3 |
| 3 | `articulos`: `status`, `destacado`, `deleted_at`, `created_at` | Ninguno |
| 4 | Normaliza `enlace` y crea el índice UNIQUE que faltaba | **Renombra slugs** |
| 5 | `titulo` a 200, `descripcion` a 300, `contenido` a MEDIUMTEXT | Trunca descripciones largas |
| 6 | Índices de listado y FULLTEXT | Ninguno |
| 7 | La FK de `autor_id` pasa de CASCADE a SET NULL | Ninguno |
| 8 | `comentarios`: MyISAM → InnoDB, latin1 → utf8mb4, moderación | **Convierte la tabla** |
| 9 | `anuncios`: columnas de vigencia e índice | Ver abajo |
| 10 | Verificación | — |

### Sobre el bloque 9 (`anuncios`)

La tabla `anuncios` **no venía en el export de phpMyAdmin que compartiste**,
así que su estructura actual se desconoce. El código PHP ya espera
`fecha_inicio`, `fecha_fin`, `impresiones`, `clics` y `updated_at`.

El bloque 9.1 las añade, pero **si ya existen fallará** con
`Duplicate column name`. Ejecuta primero el bloque 2 de `precheck.sql` y
revisa el `SHOW CREATE TABLE anuncios` que devuelve.

Opciones:

- **Ya existen** → salta el 9.1, ejecuta el 9.2 y el 9.3.
- **No existen** → ejecuta el 9.1 completo.
- **Tienes dudas** → salta el bloque 9 entero. Los endpoints de anuncios con
  vigencia fallarán, pero el resto del sitio funciona. El bloque 10 te dirá
  si la tabla quedó como el código la espera.

## Notas importantes

**El bloque 4 cambia las URLs.** Los slugs se normalizan a minúsculas y sin
espacios. Si tenías `/Camiri-Fiestas`, pasará a ser `/camiri-fiestas`. Actualiza
los enlaces compartidos en redes sociales. Los duplicados reciben sufijo: el
artículo más antiguo conserva el slug.

**El bloque 8 convierte `comentarios` a InnoDB.** En tablas MyISAM el
`ALTER TABLE ... ENGINE` reconstruye la tabla entera; con miles de comentarios
puede tardar un rato y bloquear la tabla. Los acentos (`á`, `ñ`) sobreviven
porque sí están en latin1; los guiones largos, las comillas tipográficas y los
emojis no estaban y ya se habían perdido. El precheck 1.5 te muestra cuáles
son.

**El bloque 4 normaliza `enlace` antes de crear el UNIQUE.** Los slugs con
mayúsculas o espacios se reescriben. Si tenías `/Camiri-Fiestas`, pasa a ser
`camiri-fiestas`.

**Los comentarios nuevos ahora requieren moderación.** Entra con
`aprobado = 0` y no aparece en el sitio hasta que lo apruebes desde el panel.
Sin el campo `aprobado` el endpoint era un formulario abierto: cualquiera
podía escribir en cualquier artículo.

**Los artículos borrados ya no se borran.** El panel marca `deleted_at` en
lugar de hacer `DELETE`. Los datos se pueden recuperar desde la base de datos.

**El bloque 7 invierte el `ON DELETE CASCADE` de `autor_id`.** Con el esquema
anterior, borrar un usuario eliminaba todos sus artículos. Ahora el artículo
sobrevive sin autor (`SET NULL`). Para conservar el crédito de autor en los
casos del precheck 1.3, crea un usuario "Desconocido" y asígnalo antes de
ejecutar el bloque.

## Rollback

```sql
-- Restaurar el motor y el charset originales de comentarios
ALTER TABLE comentarios ENGINE=MyISAM, CONVERT TO CHARACTER SET latin1;

-- Los artículos con slug renombrado se recuperan desde el backup del paso 1
```

Para volver del todo al estado anterior, restaura el `.sql` del paso 1.