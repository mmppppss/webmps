import { useSite } from '../utils/site';
import './css/menu.css';

/**
 * Cabecera con el menú hamburguesa y el logo.
 *
 * Arreglos sobre la versión anterior:
 *   - importaba el logo con `import logo from '/media/cookie1.webp'`. Los
 *     archivos de public/ se sirven desde la raíz, así que va como string.
 *   - usaba `class=` en vez de `className=`, que React ignora en silencio.
 *   - el nombre del sitio venía de import.meta.env.VITE_SITE_NAME.
 */
export default function Menu({ togglePanel }) {
	const site = useSite();

	return (
		<header className="menu">
			<button
				type="button"
				className="showPanel"
				onClick={togglePanel}
				aria-label="Abrir menú de navegación"
			>
				<span className="more">
					<span className="bar" />
					<span className="bar" />
					<span className="bar" />
				</span>
			</button>

			<div className="logo-container">
				<a href="/" aria-label={`${site.nombre} · ir al inicio`}>
					<img
						src={site.imagenPorDefecto}
						alt=""
						width="60"
						height="60"
						className="logo-image"
					/>
				</a>
				<a href="/">
					<h1 className="logo-title">{site.nombre}</h1>
				</a>
			</div>
		</header>
	);
}