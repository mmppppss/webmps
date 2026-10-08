<?php
declare(strict_types=1);

/**
 * Lectura de site.config.json, la única fuente de identidad del sitio.
 *
 * Antes, el nombre, el título y las keywords estaban duplicados en
 * src/config.json, .env (VITE_SITE_*), api/.env (SITE_*) y como literales en
 * el PHP. Cuatro sitios que se desincronizaban: el SEO llegaba a publicar
 * "mmppppss Blog" con URLs de mmppppss.com mientras la app mostraba otra cosa.
 *
 * Ahora hay un único archivo (site.config.json en la raíz del proyecto), que
 * leen tanto el frontend como el PHP.
 */
final class Site
{
    private static $data = null;

    public static function all(): array
    {
        if (self::$data === null) {
            self::$data = self::load();
        }

        return self::$data;
    }

    private static function load(): array
    {
        $ruta = self::ruta();

        if (!is_file($ruta)) {
            error_log('Site::load: no se encuentra site.config.json en ' . $ruta);
            return self::defaults();
        }

        $raw = @file_get_contents($ruta);
        if ($raw === false) {
            return self::defaults();
        }

        $json = json_decode($raw, true);

        if (!is_array($json)) {
            error_log('Site::load: site.config.json no es JSON válido');
            return self::defaults();
        }

        // Fusiona con los defaults: si falta una clave, se usa la de reserva en
        // vez de devolver null y romper las etiquetas SEO.
        return array_merge(self::defaults(), $json);
    }

    /** Raíz del proyecto, un nivel por encima de api/. */
    private static function ruta(): string
    {
        return dirname(__DIR__, 2) . '/site.config.json';
    }

    /**
     * Respallo mínimo por si site.config.json falta o está roto.
     *
     * OJO: a propósito NO contiene nombre, título, URL ni icono. Antes
     * decía "InfoCamiri" / infocamiri.rf.gd y, si la lectura fallaba, el
     * SEO publicaba una marca fantasma en vez de avisar (el error_log de
     * load() ya indica el problema). La identidad vive solo en el JSON.
     */
    private static function defaults(): array
    {
        return [
            'nombre'           => '',
            'titulo'           => '',
            'descripcion'      => '',
            'url'              => '',
            'twitter'          => '',
            'keywords'         => '',
            'autor'            => '',
            'idioma'           => 'es',
            'locale'           => 'es_BO',
            'themeColor'       => '',
            'favicon'          => '',
            'imagenPorDefecto' => '',
            'redes'            => [],
            'categorias'       => [],
        ];
    }

    /** Valor suelto con notación de punto: 'redes.github'. */
    public static function get(string $clave, $porDefecto = null)
    {
        $valor = self::all();

        foreach (explode('.', $clave) as $parte) {
            if (!is_array($valor) || !array_key_exists($parte, $valor)) {
                return $porDefecto;
            }
            $valor = $valor[$parte];
        }

        return $valor;
    }

    public static function nombre(): string
    {
        return (string) self::get('nombre');
    }

    public static function titulo(): string
    {
        return (string) self::get('titulo');
    }

    public static function url(): string
    {
        return rtrim((string) self::get('url'), '/');
    }

    public static function idioma(): string
    {
        return (string) self::get('idioma', 'es');
    }

    /**
     * URL absoluta de una imagen del proyecto.
     * Si el valor ya es absoluta (http/https) se devuelve tal cual.
     */
    public static function imagen(string $ruta): string
    {
        if ($ruta === '') {
            $ruta = (string) self::get('imagenPorDefecto');
        }

        if (preg_match('#^https?://#', $ruta)) {
            return $ruta;
        }

        return self::url() . '/' . ltrim($ruta, '/');
    }
}
