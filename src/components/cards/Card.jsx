import useFetch from "../utils/useFetch";
import './card.css'
export default function Card() {
	const { data, error, loading } = useFetch('last')
	if (loading) return <p>Cargando...</p>;

	return (

		<a href={`/${data.enlace}`} className="noticia-principal-link">
			<article className="noticia-principal">
				{data.img ? <img src={`/${data.img}`} alt="" /> : null}
				<div>
					<h1>{data.titulo}</h1>
					<p className="meta">
						{data.fecha} • {data.categoria} • por {data.author}
					</p>
					<p className="des">{data.descripcion}</p>
				</div>
			</article>
		</a>
	);
}
