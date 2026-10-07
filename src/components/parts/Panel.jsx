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
						<span>{categoria} ({total})</span>
						{arts.length > 0 && (
							<ul>
								{arts.map((art) => (
									<li key={art.id}>
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
						<a key={nombre} href={url} rel="noopener noreferrer">
							{nombre.slice(0, 2).toUpperCase()}
						</a>
					))}
				</div>
			)}
		</div>
	);
}