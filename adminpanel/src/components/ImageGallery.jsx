import { useState, useEffect } from 'preact/hooks';

const api = import.meta.env.VITE_APP_API_URL;

export default function ImageGallery({ handleImageSelect }) {
	const [images, setImages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isOpen, setIsOpen] = useState(false);

	// Antes el modal se abia con `isOpen && ended`, y `ended` solo se activaba
	// DESPUES del fetch: la primera vez que pulsabas el boton no aparecia nada
	// y hacia falta cerrarlo y volver a abrirlo. Ahora el fetch ocurre siempre
	// al montar y el modal muestra su propio estado de carga.
	useEffect(() => {
		let cancelado = false;

		(async () => {
			try {
				const res = await fetch(`${api}/imgs`, { credentials: 'include' })
				if (!res.ok) throw new Error('Error cargando imágenes')
				const data = await res.json()
				if (cancelado) return

				setImages(
					(Array.isArray(data) ? data : []).sort(
						(a, b) => (b.fecha || 0) - (a.fecha || 0)
					)
				)
			} catch (err) {
				if (!cancelado) setError(err.message)
			}
		})()

		return () => { cancelado = true }
	}, [])

	// Recargar la galería después de una subida nueva
	const recargar = async () => {
		try {
			const res = await fetch(`${api}/imgs`, { credentials: 'include' })
			if (!res.ok) return
			const data = await res.json()
			setImages(
				(Array.isArray(data) ? data : []).sort(
					(a, b) => (b.fecha || 0) - (a.fecha || 0)
				)
			)
		} catch (err) {
			/* silencioso: no es critico */
		}
	}

	const abrir = () => {
		setIsOpen(true)
		recargar()
	}

	return (
		<>
			<button
				type="button"
				onClick={abrir}
				className="ml-2 bg-blue-600 hover:bg-blue-700 text-white
				           font-semibold px-4 py-2 rounded shadow"
			>
				Ver imágenes
			</button>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white rounded-xl shadow-lg w-full max-w-3xl
						           max-h-[90vh] overflow-y-auto relative p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
							onClick={() => setIsOpen(false)}
						>
							&times;
						</button>
						<h2 className="text-xl font-bold mb-4">
							Imágenes Subidas
							{images.length > 0 && (
								<span className="text-sm font-normal text-gray-500">
									{' '}({images.length})
								</span>
							)}
						</h2>

						{loading && <p className="text-gray-600">Cargando...</p>}
						{error && <p className="text-red-500">{error}</p>}
						{!loading && !error && images.length === 0 && (
							<p className="text-gray-600">No hay imágenes</p>
						)}

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{images.map((img) => (
								<button
									key={img.nombre}
									type="button"
									className="flex flex-col items-center bg-gray-100 p-2
									           rounded-lg shadow-sm hover:bg-gray-200"
									onClick={() => {
										handleImageSelect(img.url)
										setIsOpen(false)
									}}
								>
									<img
										src={`/${img.url}`}
										alt={img.nombre}
										loading="lazy"
										className="w-full h-28 object-cover rounded mb-1"
									/>
									<span className="text-xs text-center break-all">{img.nombre}</span>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}