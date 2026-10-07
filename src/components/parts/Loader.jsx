/**
 * Indicador de carga.
 *
 * Antes hacía `import logo from '/media/cookie2.webp'`. Los archivos de
 * public/ se sirven en la raíz del sitio: se referencian con una ruta
 * absoluta, no con un import. El import funcionaba solo por casualidad y
 * rompía el build en cuanto cambiaba la estructura de carpetas.
 */
export default function Loader() {
	return (
		<div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
			<img className="loader" src="/media/cookie2.webp" alt="" width="48" height="48" />
			<p>Cargando…</p>
		</div>
	);
}