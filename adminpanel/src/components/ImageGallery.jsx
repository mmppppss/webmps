import React, { useState, useEffect } from 'react';

const api = import.meta.env.VITE_APP_API_URL;
export default function ImageGallery({ handleImageSelect }) {
	const [images, setImages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isOpen, setIsOpen] = useState(false);
	const [ended, setEnded] = useState(false);

	useEffect(() => {
		setLoading(true);
		fetch(`${api}/imgs`)
			.then(res => {
				if (!res.ok) throw new Error('Error cargando imágenes');
				return res.json();
			})
			.then(data => {
				setImages(Object.values(data));
				setLoading(false);
				setEnded(true);
			})
			.catch(err => {
				setError(err.message);
				setLoading(false);
			});
	}, [isOpen]);

	return (

		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
			>
				Ver imágenes
			</button>

			{isOpen && ended && (
				<div
					className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
							onClick={() => setIsOpen(false)}
						>
							&times;
						</button>
						<h2 className="text-xl font-bold mb-4">Imágenes Subidas</h2>

						{loading && <p className="text-gray-600">Cargando...</p>}
						{error && <p className="text-red-500">{error}</p>}

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{images.length === 0 && !loading && <p>No hay imágenes</p>}
							{images.map((img) => (
								<div
									key={img.nombre}
									className="flex flex-col items-center bg-gray-100 p-2 rounded-lg shadow-sm"
									onClick={() => {handleImageSelect(img.url); setIsOpen(false);}}
								>
									<img
										src={`../${img.url}`}
										alt={img.nombre}
										loading="lazy"
										className="w-full h-28 object-cover rounded mb-1"
									/>
									<p className="text-xs text-center break-all">{img.nombre}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
