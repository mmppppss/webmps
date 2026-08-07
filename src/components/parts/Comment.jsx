import CommentForm from "./CommentForm";
import useFetch from "../utils/useFetch";
import "./css/comment.css"

export default function Comment({ limit = 10, id }) {
	const endpoint = `art/comments/${id}`;
	const { data = [], error, loading } = useFetch(endpoint);
    if (loading) return "Cargando...";
	if (error) return null;
	return (
		<section className="comments">
			<h2>Comentarios</h2>

			{data.length === 0 && (
				<p className="comments-empty">
					Aún no hay comentarios. Sé el primero en participar.
				</p>
			)}

			{data.length > 0 && (
				<div className="comments-cards">
					{data.slice(0, limit).map((comment) => (
						<article key={comment.id} className="comment-card">
							<header className="comment-card-header">
								<h3>{comment.autor || "Anónimo"}</h3>
							</header>

							<p className="comment-card-content">
								{comment.contenido}
							</p>
						</article>
					))}
				</div>
			)}

			<CommentForm id={id}  />
		</section>
	);
}
