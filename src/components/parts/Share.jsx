import { useState } from 'react';

/**
 * Botones de compartir.
 *
 * Antes usaba `article.nombre`, un campo que no existe en la respuesta de la
 * API, asi que todos los enlaces salian con el texto "undefined". Ademas eran
 * cinco botones apuntando a cuatro servicios.
 */
export default function Share({ article }) {
	const [copiado, setCopiado] = useState(false);

	if (!article) return null;

	const url = typeof window !== 'undefined' ? window.location.href : '';
	// el titulo viene como `titulo`; se conserva `nombre` como fallback por si
	// algun consumidor pasa el objeto con otro nombre
	const titulo = article.titulo || article.nombre || article.enlace || '';

	const compartir = async () => {
		if (navigator.share) {
			try {
				await navigator.share({ title: titulo, url });
				return;
			} catch (err) {
				// el usuario canceló el diálogo: no es un error
				if (err && err.name === 'AbortError') return;
			}
		}

		try {
			await navigator.clipboard.writeText(url);
			setCopiado(true);
			setTimeout(() => setCopiado(false), 2000);
		} catch (err) {
			console.error('No se pudo copiar el enlace:', err);
		}
	};

	const objetivos = [
		{
			label: 'WhatsApp',
			className: 'share-link share-whatsapp',
			href: `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`,
		},
		{
			label: 'Facebook',
			className: 'share-link share-facebook',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
		},
		{
			label: 'X',
			className: 'share-link share-x',
			href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titulo)}`,
		},
	];

	return (
		<div className="share-buttons">
			{objetivos.map((t) => (
				<a
					key={t.label}
					href={t.href}
					target="_blank"
					rel="noopener noreferrer"
					className={t.className}
				>
					{t.label}
				</a>
			))}

			<button type="button" className="share-link" onClick={compartir}>
				{copiado ? '¡Enlace copiado!' : 'Compartir'}
			</button>
		</div>
	);
}