import { useEffect, useState } from 'preact/hooks';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Lista de anuncios.
 *
 * Antes `handleEdit` estaba vacío y el botón "Editar" no hacía nada, porque no
 * había ruta de actualización en la API. Ahora llama a `onEditar` y el
 * Dashboard abre el formulario precargado.
 */
export default function AdList({ onEditar }) {
	const [ads, setAds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [msg, setMsg] = useState(null);

	useEffect(() => {
		fetch(`${api}/ad`, { credentials: 'include' })
			.then((res) => {
				if (!res.ok) throw new Error('No autorizado')
				return res.json()
			})
			.then((data) => {
				setAds(Array.isArray(data) ? data : [])
				setLoading(false)
			})
			.catch((err) => {
				console.error(err)
				setError("No se pudieron cargar los anuncios.")
				setLoading(false)
			})
	}, [])

	const handleDelete = async (id) => {
		if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return
		try {
			// faltaba credentials: 'include', asi que si la sesion expiraba
			// el backend devolvia 401 en silencio
			const res = await fetch(`${api}/ad/delete/${id}`, {
				method: "POST",
				credentials: "include",
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.status !== "success") {
				setMsg({ tipo: "error", texto: json.message || "Error al eliminar" })
				return
			}
			setAds((prev) => prev.filter((ad) => ad.id !== id))
			setMsg({ tipo: "ok", texto: "Anuncio eliminado" })
		} catch (e) {
			console.error(e)
			setMsg({ tipo: "error", texto: "Error en el servidor" })
		}
	}

	const handleToggle = async (ad) => {
		try {
			const res = await fetch(`${api}/ad/toggle/${ad.id}`, {
				method: "POST",
				credentials: "include",
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.status !== "success") {
				setMsg({ tipo: "error", texto: json.message || "No se pudo cambiar el estado" })
				return
			}
			setAds((prev) =>
				prev.map((a) => (a.id === ad.id ? { ...a, activo: a.activo ? 0 : 1 } : a))
			)
		} catch (e) {
			setMsg({ tipo: "error", texto: "Error en el servidor" })
		}
	}

	const handleEdit = (ad) => {
		if (onEditar) onEditar(ad);
	};

	const PRIORIDADES = { 1: "Alta (Grande)", 2: "Media (Imagen)", 3: "Baja (Cinta)" }

	if (loading) return <p className="p-10 text-gray-400">Cargando anuncios...</p>
	if (error) return <p className="p-10 text-red-400">{error}</p>

	return (
		<div className="space-y-4 m-10">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-100">Anuncios</h2>
				<button
					onClick={() => onEditar && onEditar(null)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
				>
					Crear Anuncio
				</button>
			</div>

			{msg && (
				<p className={`text-sm ${msg.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
					{msg.texto}
				</p>
			)}

			{ads.length === 0 ? (
				<p className="text-gray-400">No hay anuncios.</p>
			) : (
				<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{ads.map((ad) => {
						const vencido = ad.fecha_fin && new Date(ad.fecha_fin) < new Date()
						const inactivo = !Number(ad.activo)
						return (
							<li key={ad.id}
								className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
								<img
									src={`/${ad.imagen}`}
									alt={ad.titulo}
									className="w-full h-40 object-cover"
									loading="lazy"
								/>
								<div className="p-4 space-y-2">
									<h3 className="text-lg font-semibold text-gray-100">{ad.titulo}</h3>
									<p className="text-gray-300">{ad.descripcion}</p>
									<p className="text-sm text-gray-400">
										<strong>Ubicación:</strong> {ad.ubicacion}
									</p>
									<p className="text-sm text-gray-400">
										<strong>Prioridad:</strong> {PRIORIDADES[ad.prioridad] || ad.prioridad}
									</p>
									<p className="text-xs text-gray-500">
										{ad.fecha_inicio || '—'} → {ad.fecha_fin || 'sin fin'}
									</p>
									<p className="text-xs">
										{inactivo
											? <span className="text-red-400">Inactivo</span>
											: vencido
												? <span className="text-yellow-400">Vencido</span>
												: <span className="text-green-400">Activo</span>}
									</p>
									<div className="flex justify-end gap-2 pt-2 flex-wrap">
										<button
											onClick={() => handleToggle(ad)}
											className="bg-slate-600 hover:bg-slate-500 text-white
											           font-semibold px-3 py-1 rounded"
										>
											{Number(ad.activo) ? 'Desactivar' : 'Activar'}
										</button>
										<button
											onClick={() => handleEdit(ad)}
											className="bg-yellow-500 hover:bg-yellow-600 text-black
											           font-semibold px-3 py-1 rounded"
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
						)
					})}
				</ul>
			)}
		</div>
	);
}