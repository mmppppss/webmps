import { useState } from "react";

export default function CommentForm({id }) {
	const [nombre, setNombre] = useState("");
	const [comentario, setComentario] = useState("");


	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!comentario.trim()) return;

		try {
			const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/art/comments/${id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					author: nombre.trim() || 'Anónimo',
					content: comentario.trim()
				})
			});
			if (!response.ok) throw new Error('No se pudo enviar el comentario');

			const savedComment = await response.json();

			setComentario('');
			setNombre('');
			window.location.reload();
		} catch (err) {
			console.error(err);
		}
	};


	return (
		<section className="comments-form-section">
			<header className="comments-form-header">
				<h3>Deja un comentario</h3>
				<p>Tu opinión es importante</p>
			</header>

			<form className="comment-form" onSubmit={handleSubmit}>
				{/* Nombre */}
				<div className="comment-row">
					<label htmlFor="comment-name">Nombre</label>
					<input
						id="comment-name"
						type="text"
						className="comment-name"
						placeholder="Anónimo"
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
					/>
				</div>

				{/* Comentario */}
				<div className="comment-row">
					<label htmlFor="comment-content">Comentario</label>
					<textarea
						id="comment-content"
						className="comment-input"
						placeholder="Escribe tu comentario..."
						value={comentario}
						onChange={(e) => setComentario(e.target.value)}
					/>
				</div>

				{/* Acciones */}
				<div className="comment-actions">
					<span className="comment-hint">
						Sé respetuoso y aporta al debate
					</span>

					<button type="submit" className="comment-submit">
						Publicar comentario
					</button>
				</div>
			</form>
		</section>
	);
}
