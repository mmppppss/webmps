import useFetch from '../utils/useFetch';
import { formatDate } from '../utils/date';
import './card.css';

export default function Card() {
	const { data, error, loading } = useFetch('last');

	if (loading) return <p>Cargando…</p>;
	if (error || !data || !data.enlace) {
		return <p>No hay artículos publicados todavía.</p>;
	}

	return (
		<a href={`/${data.enlace}`} className="noticia-principal-link">
			<article className="noticia-principal">
				{data.img && (
					<img
						src={`/${data.img}`}
						alt={data.titulo}
						width="1200"
						height="675"
						fetchPriority="high"
					/>
				)}
				<div>
					<h1>{data.titulo}</h1>
					<p className="meta">
						{formatDate(data.created_at || data.fecha)} • {data.categoria} • por {data.author}
					</p>
					{data.descripcion && <p className="des">{data.descripcion}</p>}
				</div>
			</article>
		</a>
	);
}