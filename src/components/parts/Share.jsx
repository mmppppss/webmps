
export default function share({ article }) {
	return (
		<div className="share-buttons">
			<a
				href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.nombre)}`}
				target="_blank"
				className="share-link"
				rel="noopener noreferrer"
			>
				Compartir en X
			</a>
			<a
				href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
				target="_blank"
				className="share-link"
				rel="noopener noreferrer"
			>
				Compartir en Facebook
			</a>
			<a
				href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.nombre)}`}
				target="_blank"
				className="share-link"
				rel="noopener noreferrer"
			>
				Compartir en LinkedIn
			</a>
			<a
				href={`mailto:?subject=${encodeURIComponent(article.nombre)}&body=${encodeURIComponent(window.location.href)}`}
				className="share-link"
			>
				Share via Email
			</a>
			<a
				href="#null"
				className="share-link"
				onClick={() => {
					navigator.clipboard.writeText(window.location.href.replace('#null',''))
						.then(() => alert('Enlace copiado!'))
						.catch((error) => console.error('Error copying text:', error));
				}}
			>
				Copy link
			</a>
			{/* Compartir usando la API de Web Share (para dispositivos móviles) */}
			<a
				href="#null"
				className="share-link"
				onClick={() => {
					if (navigator.share) {
						navigator.share({
							title: article.nombre,
							url: article.enlace
						})
							.then(() => console.log('Article shared successfully'))
							.catch((error) => console.log('Error sharing article:', error));
					} else {
						alert('No se puede compartir en este dispositivo.');
					}
				}}
			>
				Compartir    </a>
		</div>
	)
}

