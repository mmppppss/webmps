import useFetch from '../utils/useFetch';
import './card.css'

export default function Rel({ limit = 10, enlace = null }) {
	const endpoint = enlace ? `art/rel/${enlace}` : 'arts';
	const { data, error, loading } = useFetch(endpoint);
	if (loading) return <p>Cargando...</p>;
	const related = data
		.filter(k => k.enlace !== enlace)
		.slice(0, limit);
	function gen() {
		return (<div className="suggest">
			<div className="related-cards">
				{related.map(k => {
					return (
						<div key={k.enlace} className="relatedCard">
							<a href={`/${k.enlace}`} className="card-link">
								{k.img ? <img src={`/${k.img}`} alt={k.titulo} /> : null}
								<div>
									<h4>{k.titulo}</h4>
									<p>{k.descripcion.substring(0, 80) + "..."}</p>
								</div>
							</a>
						</div>
					);
				})}
			</div>
		</div>)
	}
	return (
		<>
			{data.length > 1 ? gen() : <span></span>}
		</>
	);
}
