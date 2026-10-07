import { useState, useMemo } from 'react';
import './css/search.css';

/**
 * Búsqueda del panel lateral.
 *
 * Antes filtraba en un useEffect sobre `art.contenido`. Desde que /arts ya no
 * devuelve el cuerpo del artículo (solo el listado), ese campo ya no existe:
 * la búsqueda sobre el cuerpo era imposible sin descargarlo entero, por eso
 * ahora el servidor expone /art/search con índice FULLTEXT para quien necesite
 * buscar dentro del texto.
 *
 * El filtrado aquí es sobre el listado ya cargado, así que es instantáneo y no
 * genera peticiones.
 */
export default function Search({ articulos }) {
	const [term, setTerm] = useState('');

	const resultados = useMemo(() => {
		const q = term.toLowerCase().trim();
		if (!q || !Array.isArray(articulos)) return [];

		return articulos.filter(
			(art) =>
				(art.titulo || '').toLowerCase().includes(q) ||
				(art.descripcion || '').toLowerCase().includes(q) ||
				(art.categoria || '').toLowerCase().includes(q)
		);
	}, [term, articulos]);

	return (
		<div className="search-container">
			<label htmlFor="search-input" className="sr-only">Buscar artículos</label>
			<input
				id="search-input"
				type="search"
				placeholder="Buscar..."
				className="search-input"
				value={term}
				onChange={(e) => setTerm(e.target.value)}
			/>

			{term.trim() !== '' && (
				<div className="results-panel">
					{resultados.length === 0 ? (
						<p className="result-empty">Sin resultados para «{term.trim()}»</p>
					) : (
						resultados.map((art) => (
							<a href={`/${art.enlace}`} key={art.id} className="result-item">
								<h4>{art.titulo}</h4>
								<p>{(art.descripcion || '').slice(0, 120)}</p>
							</a>
						))
					)}
				</div>
			)}
		</div>
	);
}