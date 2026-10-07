import { useState } from 'react';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Formulario de comentarios.
 *
 * Antes, tras publicar, hacia `window.location.reload()`, lo que recarga toda
 * la pagina y pierde la posicion de scroll. Ahora el comentario se agrega al
 * estado local del padre.
 *
 * Los comentarios nuevos se guardan con aprobado=0: se avisa al usuario de
 * que_passará por moderación en lugar de publicarlo al instante.
 */
export default function CommentForm({ id, onCreated }) {
	const [nombre, setNombre] = useState('');
	const [comentario, setComentario] = useState('');
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState(null);
	const [aviso, setAviso] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!comentario.trim() || enviando) return;

		setEnviando(true);
		setError(null);
		setAviso(null);

		try {
			const response = await fetch(`${api}/art/comments/${id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					author: nombre.trim() || 'Anónimo',
					content: comentario.trim(),
				}),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(data.message || 'No se pudo enviar el comentario');
			}

			setComentario('');
			setNombre('');
			setAviso(data.message || 'Comentario recibido');

			if (onCreated) onCreated(data);
		} catch (err) {
			setError(err.message || 'No se pudo enviar el comentario');
		} finally {
			setEnviando(false);
		}
	};

	return (
		<section className="comments-form-section">
			<header className="comments-form-header">
				<h3>Deja un comentario</h3>
				<p>Tu opinión es importante</p>
			</header>

			<form className="comment-form" onSubmit={handleSubmit}>
				<div className="comment-row">
					<label htmlFor="comment-name">Nombre</label>
					<input
						id="comment-name"
						type="text"
						maxLength={50}
						className="comment-name"
						placeholder="Anónimo"
						value={nombre}
						onInput={(e) => setNombre(e.target.value)}
					/>
				</div>

				<div className="comment-row">
					<label htmlFor="comment-content">Comentario</label>
					<textarea
						id="comment-content"
						className="comment-input"
						placeholder="Escribe tu comentario..."
						value={comentario}
						onInput={(e) => setComentario(e.target.value)}
						required
					/>
				</div>

				{error && <p className="comment-error">{error}</p>}
				{aviso && <p className="comment-aviso">{aviso}</p>}

				<div className="comment-actions">
					<span className="comment-hint">Sé respetuoso y aporta al debate</span>
					<button type="submit" className="comment-submit" disabled={enviando}>
						{enviando ? 'Enviando…' : 'Publicar comentario'}
					</button>
				</div>
			</form>
		</section>
	);
}