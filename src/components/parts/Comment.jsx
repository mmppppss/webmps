import { useEffect, useState } from 'react';
import CommentForm from './CommentForm';
import './css/comment.css';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Sección de comentarios.
 *
 * Antes delegaba la carga a useFetch y, al enviar un comentario, el formulario
 * hacia window.location.reload(). Ahora la carga es local para poder insertar
 * el comentario recién enviado sin recargar la página.
 */
export default function Comment({ limit = 10, id }) {
	const [comentarios, setComentarios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!id) {
			setCargando(false);
			return;
		}

		let cancelado = false;

		(async () => {
			try {
				const res = await fetch(`${api}/art/comments/${id}`);
				if (!res.ok) throw new Error('Error al cargar comentarios');
				const data = await res.json();
				if (!cancelado) {
					setComentarios(Array.isArray(data) ? data : []);
					setError(false);
				}
			} catch (err) {
				if (!cancelado) setError(true);
			} finally {
				if (!cancelado) setCargando(false);
			}
		})();

		return () => { cancelado = true };
	}, [id]);

	if (cargando) return <p>Cargando comentarios…</p>;
	if (error) return null;

	return (
		<section className="comments">
			<h2>Comentarios</h2>

			{comentarios.length === 0 && (
				<p className="comments-empty">
					Aún no hay comentarios. Sé el primero en participar.
				</p>
			)}

			{comentarios.length > 0 && (
				<div className="comments-cards">
					{comentarios.slice(0, limit).map((comment) => (
						<article key={comment.id ?? `${comment.autor}-${comment.contenido}`} className="comment-card">
							<header className="comment-card-header">
								<h3>{comment.autor || 'Anonimo'}</h3>
								{comment.created_at && (
									<time className="comment-date">{comment.created_at}</time>
								)}
							</header>

							<p className="comment-card-content">{comment.contenido}</p>
						</article>
					))}
				</div>
			)}

			<CommentForm id={id} />
		</section>
	);
}