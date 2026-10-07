/**
 * Tarjeta de artículo en la lista del panel.
 *
 * Antes leía `article.fecha`, que era la DATE original. Tras la migración la
 * columna con hora es `created_at`, y el estado importa: un borrador o un
 * artículo borrado lógicamente tienen que distinguirse de un publicado.
 */
export default function ArticleCard({ article, onDelete, onEdit }) {
	const {
		id,
		titulo,
		categoria,
		enlace,
		created_at,
		status,
		deleted_at,
		vistas,
	} = article;

	const fecha = created_at
		? new Date(String(created_at).replace(' ', 'T')).toLocaleDateString('es-BO', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		})
		: '';

	const borrado = Boolean(deleted_at);

	const estado = borrado
		? { texto: 'Eliminado', clases: 'bg-gray-700 text-gray-300' }
		: status === 'borrador'
			? { texto: 'Borrador', clases: 'bg-yellow-900 text-yellow-200' }
			: { texto: 'Publicado', clases: 'bg-green-900 text-green-200' };

	return (
		<article className="p-4 border rounded shadow flex flex-col gap-2 mb-4 border-gray-700">
			<div className="flex justify-between items-start gap-4">
				<div className="min-w-0 mr-9">
					<h2 className={`text-lg font-semibold ${borrado ? 'line-through text-gray-500' : ''}`}>
						{titulo}
					</h2>
					<p className="text-sm text-gray-500">
						{categoria} · {fecha}
						{vistas != null && ` · ${vistas} vistas`}
					</p>
					<span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${estado.clases}`}>
						{estado.texto}
					</span>
				</div>

				<div className="flex gap-2 shrink-0">
					<a
						href={`/${enlace}`}
						target="_blank"
						rel="noopener noreferrer"
						className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
					>
						Ver
					</a>
					<button
						type="button"
						onClick={() => onEdit(id)}
						className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded"
					>
						Editar
					</button>
					<button
						type="button"
						onClick={() => onDelete(id)}
						disabled={borrado}
						className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded
						           disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Eliminar
					</button>
				</div>
			</div>
		</article>
	);
}