import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Share } from './parts';
import { Rel } from './cards';
import gfm from 'remark-gfm';
import '../css/md.css';
import useFetch from './utils/useFetch';
import { formatDate } from './utils/date';
import Comment from './parts/Comment';

export default function Content({ enlace }) {
	const { data: article, error, loading } = useFetch(`art/${enlace}`);
	const [recargarComentarios, setRecargarComentarios] = useState(0);

	if (loading) return <p>Cargando…</p>;

	if (error) {
		return (
			<div className="content">
				<h1 className="title">No encontrado</h1>
				<p>El artículo que buscas no existe o ya no está publicado.</p>
				<p><a href="/">Volver al inicio</a></p>
			</div>
		);
	}

	// Un artículo inexistente llega como `null` o `{}`, y antes eso se
	// renderizaba con campos undefined en pantalla
	if (!article || !article.titulo) {
		return (
			<div className="content">
				<h1 className="title">No encontrado</h1>
				<p>El artículo que buscas no existe o ya no está publicado.</p>
				<p><a href="/">Volver al inicio</a></p>
			</div>
		);
	}

	return (
		<div className="content">
			<h1 className="title">{article.titulo}</h1>
			<h2 className="author">por: {article.author}</h2>

			<div className="info">
				<span>
					{article.vistas} {article.vistas === 1 ? 'vista' : 'vistas'}
				</span>
				<span className="separator"> | </span>
				<span>{article.categoria}</span>
				<span className="separator"> | </span>
				<time dateTime={article.created_at || article.fecha}>
					{formatDate(article.created_at || article.fecha)}
				</time>
			</div>

			{article.img && (
				<figure className="article-cover">
					<img
						src={`/${article.img}`}
						alt={article.titulo}
						width="1200"
						height="675"
						fetchPriority="high"
					/>
					{article.descripcion && <figcaption>{article.descripcion}</figcaption>}
				</figure>
			)}

			<div className="markdown-body">
				<ReactMarkdown
					remarkPlugins={[gfm]}
					components={{
						img: ({ node, ...props }) => (
							<figure>
								<img {...props} loading="lazy" />
								{props.alt && <figcaption>{props.alt}</figcaption>}
							</figure>
						),
					}}
				>
					{article.contenido}
				</ReactMarkdown>
			</div>

			<Comment
				id={article.id}
				key={recargarComentarios}
				onCreated={() => setRecargarComentarios((n) => n + 1)}
			/>

			<Share article={article} />
			<Rel limit={3} enlace={article.enlace} />
		</div>
	);
}