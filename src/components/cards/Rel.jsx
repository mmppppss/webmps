import useFetch from '../utils/useFetch';
import './card.css'

/**
 * Artículos relacionados.
 *
 * Antes el backend buscaba con cuatro LIKE '%titulo%' (full table scan) y
 * limitaba a 4, pero el frontend hacía `.slice(0, limit)` sobre datos que a
 * veces venían ya recortados o vacíos. Ahora el backend decide el límite y el
 * frontend solo recorta por seguridad.
 */
export default function Rel({ limit = 10, enlace = null }) {
	const endpoint = enlace ? `art/rel/${enlace}` : 'arts';
	const { data, error, loading } = useFetch(endpoint);

	if (loading) return <p>Cargando…</p>;
	if (error || !Array.isArray(data) || data.length === 0) return null;

	const relacionados = data
		.filter((k) => k.enlace !== enlace)
		.slice(0, limit);

	if (relacionados.length === 0) return null;

	return (
		<div className="suggest">
			<div className="related-cards">
				{relacionados.map((k) => (
					<div key={k.enlace} className="relatedCard">
						<a href={`/${k.enlace}`} className="card-link">
							{k.img ? (
								<img
									src={`/${k.img}`}
									alt={k.titulo}
									loading="lazy"
									width="400"
									height="225"
								/>
							) : null}
							<div>
								<h4>{k.titulo}</h4>
								<p>
									{(k.descripcion || '').slice(0, 80)}
									{(k.descripcion || '').length > 80 ? '…' : ''}
								</p>
							</div>
						</a>
					</div>
				))}
			</div>
		</div>
	);
}