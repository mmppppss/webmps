import { useEffect, useState } from "react";
const api = import.meta.env.VITE_APP_API_URL;
export default function AdList({ setToRender }) {
	const [ads, setAds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetch(`${api}/ad`)
			.then((res) => res.json())
			.then((data) => {
				setAds(data);
				setLoading(false);
			})
			.catch((err) => {
				console.error(err);
				setError("No se pudieron cargar los anuncios.");
				setLoading(false);
			});
	}, []);

	const handleDelete = async (id) => {
		if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return;
		try {
			const res = await fetch(`${api}/ad/delete/${id}`, {
				method: "POST",
			});
			const json = await res.json();
			if (json.status === "success") {
				setAds((prev) => prev.filter((ad) => ad.id !== id));
			} else {
				alert("Error al eliminar");
			}
		} catch (e) {
			console.error(e);
			alert("Error en el servidor");
		}
	};

	const handleEdit = (ad) => {
		// Aquí puedes navegar a otro componente o mostrar un modal

	};

	if (loading) return <p>Cargando anuncios...</p>;
	if (error) return <p>{error}</p>;

	return (

		<div className="space-y-4 m-10">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-100">Anuncios</h2>
				<button
					onClick={() => setToRender(3)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
				>
					Crear Anuncio
				</button>
			</div>

			{ads.length === 0 ? (
				<p className="text-gray-400">No hay anuncios.</p>
			) : (
				<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{ads.map((ad) => (
						<li key={ad.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
							<img
								src={`/${ad.imagen}`}
								alt={ad.titulo}
								className="w-full h-40 object-cover"
							/>
							<div className="p-4 space-y-2">
								<h3 className="text-lg font-semibold text-gray-100">{ad.titulo}</h3>
								<p className="text-gray-300">{ad.descripcion}</p>
								<p className="text-sm text-gray-400">
									<strong>Ubicación:</strong> {ad.ubicacion}
								</p>
								<p className="text-sm text-gray-400">
									<strong>Prioridad:</strong> {ad.prioridad}
								</p>
								<div className="flex justify-end gap-2 pt-2">
									<button
										onClick={() => handleEdit(ad)}
										className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 rounded"
									>
										Editar
									</button>
									<button
										onClick={() => handleDelete(ad.id)}
										className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
									>
										Eliminar
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>

	);
}
