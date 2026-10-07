import { useState, useEffect } from 'react';
import Search from './Search';
import { useSite } from '../utils/site';
import './css/panel.css';

/**
 * Panel lateral con el árbol de artículos agrupados por categoría.
 *
 * Antes hacía fetch(`${api}/arts`) y agrupaba en el navegador: la barra
 * lateral descargaba el listado completo solo para pintar títulos. Ahora pide
 * /arts/grouped, que devuelve categoría y total.
 */
export default function Panel() {
	const site = useSite();

	const [list, setList] = useState([]);
	const [grupos, setGrupos] = useState([]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/arts`);
				if (!res.ok) throw new Error('Error');
				const data = await res.json();
				setList(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error('Ha ocurrido un error:', error);
			}
		})();
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/arts/grouped`);
				if (!res.ok) return;
				const data = await res.json();
				setGrupos(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error('Ha ocurrido un error:', error);
			}
		})();
	}, []);

	function toggleTree(e) {
		e.currentTarget.parentElement?.querySelector('ul')?.classList.toggle('collapsed');
	}

	function groupArticlesByCategory() {
		// Normaliza para que 'otros' y 'Otro' caigan en el mismo grupo: la
		// tabla usaba minúscula y el panel enviaba mayúscula, y salían dos
		// grupos con el mismo contenido.
		const norm = (c) => (c || 'Otro').trim();

		const byCategory = new Map();

		grupos.forEach((g) => byCategory.set(norm(g.categoria), 0));
		list.forEach((art) => {
			const cat = norm(art.categoria);
			byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
		});

		return Array.from(byCategory.entries())
			.sort((a, b) => a[0].localeCompare(b[0], 'es'))
			.map(([categoria, total]) => {
				const arts = list.filter((art) => norm(art.categoria) === categoria);

				return (
					<li key={categoria}>
						<span onClick={toggleTree} style={{ cursor: 'pointer' }}>
							{categoria} ({total})
						</span>
						{arts.length > 0 && (
							<ul>
								{arts.map((art) => (
									<li key={art.id} className="art">
										<span><a href={`/${art.enlace}`}>{art.titulo}</a></span>
									</li>
								))}
							</ul>
						)}
					</li>
				);
			});
	}

	const redes = Object.entries(site.redes || {});

	return (
		<div className="panel" id="panel">
			<Search articulos={list} />
			<div className="tree">
				<ul>
					<li><span>/</span></li>
					<ul>
						<li><span><a href="/">index</a></span></li>
						<li>
							<span onClick={toggleTree} style={{ cursor: 'pointer' }}>
								Artículos/
							</span>
							<ul>
								{groupArticlesByCategory()}
							</ul>
						</li>
					</ul>
				</ul>
			</div>

			{redes.length > 0 && (
				<div className="social">
					{redes.map(([nombre, url]) => (
						<a
							key={nombre}
							href={url}
							rel="noopener noreferrer"
							aria-label={nombre}
							className="social-link"
							title={nombre}
						>
							{nombre === 'github' && <IconGitHub />}
							{nombre === 'facebook' && <IconFacebook />}
							{nombre === 'instagram' && <IconInstagram />}
							{!['github', 'facebook', 'instagram'].includes(nombre) && (
								<span className="social-text">{nombre.slice(0, 2).toUpperCase()}</span>
							)}
						</a>
					))}
				</div>
			)}
		</div>
	);
}

/** Iconos inline SVG, sin dependencias externas. */
function IconGitHub() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.2.68.8.56A10.52 10.52 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
		</svg>
	);
}

function IconFacebook() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M13.5 21.95v-8.21h2.76l.41-3.2h-3.17V8.26c0-.93.26-1.56 1.59-1.56h1.69V3.85a22.4 22.4 0 0 0-2.47-.13c-2.44 0-4.11 1.49-4.11 4.22v2.6H7.5v3.2h2.7v8.21h3.3z" />
		</svg>
	);
}

function IconInstagram() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<rect x="2" y="2" width="20" height="20" rx="5" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
		</svg>
	);
}