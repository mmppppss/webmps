/**
 * Metadatos por artículo en el cliente.
 *
 * ESTE COMPONENTE ESTÁ INACTIVO a propósito, y no debe reactivarse tal cual.
 *
 * Motivo: las etiquetas <title>, Open Graph y Twitter Card las genera
 * api/index.php en el servidor, con datos reales del artículo. Este
 * componente:
 *   - exige montar un <HelmetProvider> en main.jsx, que estaba comentado
 *   - solo funciona tras la hidratación, cuando un crawler ya ha leído el
 *     HTML: Google no lo ejecutaría
 *   - tenía el dominio y la imagen de compartir hardcodeados
 *   - ponía la URL canónica sin comprobar que fuera correcta
 *
 * Si en algún momento hace falta SEO dinámico de verdad, la vía correcta es
 * un pre-render en el servidor, no Helmet en el cliente.
 */
export default function Head() {
	return null;
}