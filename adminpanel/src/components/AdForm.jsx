import { useState, useEffect } from 'preact/hooks';
import Upload from './Upload';
import ImageGallery from './ImageGallery';

const api = import.meta.env.VITE_APP_API_URL;

// Debe coincidir con UBICACIONES en api/controllers/AdController.php
const UBICACIONES = [
	{ valor: 'header', etiqueta: 'Cabecera' },
	{ valor: 'sidebar', etiqueta: 'Barra lateral' },
	{ valor: 'footer', etiqueta: 'Pie de página' },
	{ valor: 'inline', etiqueta: 'Dentro del artículo' },
	{ valor: 'popup', etiqueta: 'Ventana emergente' },
]

const PRIORIDADES = [
	{ valor: 1, etiqueta: 'Alta (Grande)' },
	{ valor: 2, etiqueta: 'Media (Imagen)' },
	{ valor: 3, etiqueta: 'Baja (Cinta)' },
]

const VACIO = {
	titulo: '',
	imagen: '',
	enlace: '',
	ubicacion: 'header',
	descripcion: '',
	prioridad: 2,
	fecha_inicio: '',
	fecha_fin: '',
	activo: 1,
}

export default function AdForm({ ad, onSaved }) {
	const editando = Boolean(ad && ad.id)
	const [form, setForm] = useState(VACIO)
	const [msg, setMsg] = useState(null)
	const [enviando, setEnviando] = useState(false)

	useEffect(() => {
		if (editando) {
			setForm({
				titulo: ad.titulo || '',
				imagen: ad.imagen || '',
				enlace: ad.enlace || '',
				ubicacion: ad.ubicacion || 'header',
				descripcion: ad.descripcion || '',
				prioridad: Number(ad.prioridad) || 2,
				fecha_inicio: ad.fecha_inicio || '',
				fecha_fin: ad.fecha_fin || '',
				activo: Number(ad.activo) ?? 1,
			})
		} else {
			setForm(VACIO)
		}
	}, [ad])

	const change = (e) => {
		const { name, value } = e.target
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	const submit = async (e) => {
		e.preventDefault()
		if (enviando) return

		setEnviando(true)
		setMsg(null)

		const url = editando ? `${api}/ad/update/${ad.id}` : `${api}/ad/create`

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					...form,
					prioridad: Number(form.prioridad),
					activo: Number(form.activo),
					fecha_inicio: form.fecha_inicio || null,
					fecha_fin: form.fecha_fin || null,
				}),
			})

			const data = await response.json().catch(() => ({}))

			if (!response.ok) {
				setMsg({ tipo: 'error', texto: data.message || 'No se pudo guardar el anuncio' })
				return
			}

			if (onSaved) onSaved(data)
			else window.location.href = '/panel/'
		} catch (err) {
			console.error(err)
			setMsg({ tipo: 'error', texto: 'Error al conectar con el servidor' })
		} finally {
			setEnviando(false)
		}
	}

	return (
		<form
			onSubmit={submit}
			className="bg-gray-800 text-gray-200 p-6 rounded-lg shadow-md space-y-4 w-full max-w-lg mx-auto my-8"
		>
			<h2 className="text-2xl font-bold text-blue-400 text-center">
				{editando ? `Editar anuncio #${ad.id}` : 'Crear anuncio'}
			</h2>

			<input
				type="text"
				name="titulo"
				placeholder="Título"
				value={form.titulo}
				onChange={change}
				required
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<input
				type="text"
				name="imagen"
				placeholder="Imagen (URL o usa 'Subir imagen')"
				value={form.imagen}
				onChange={change}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			{form.imagen && (
				<img src={`/${form.imagen}`} alt="Vista previa"
					className="w-full h-32 object-cover rounded" loading="lazy" />
			)}

			<input
				type="text"
				name="enlace"
				placeholder="Enlace (https://... o /ruta)"
				value={form.enlace}
				onChange={change}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<div>
				<label className="block text-sm text-gray-300 mb-1" for="ad-ubicacion">
					Ubicación
				</label>
				<select
					id="ad-ubicacion"
					name="ubicacion"
					value={form.ubicacion}
					onChange={change}
					required
					className="w-full p-2 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{UBICACIONES.map((u) => (
						<option key={u.valor} value={u.valor}>{u.etiqueta}</option>
					))}
				</select>
			</div>

			<textarea
				name="descripcion"
				placeholder="Descripción"
				value={form.descripcion}
				onChange={change}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				rows="4"
			/>

			<div>
				<label className="block text-sm text-gray-300" for="ad-prioridad">
					Prioridad
				</label>
				<select
					id="ad-prioridad"
					name="prioridad"
					value={form.prioridad}
					onChange={change}
					className="w-full mt-1 p-2 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{PRIORIDADES.map((p) => (
						<option key={p.valor} value={p.valor}>{p.etiqueta}</option>
					))}
				</select>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="block text-sm text-gray-300" for="ad-inicio">
						Visible desde
					</label>
					<input
						id="ad-inicio"
						type="date"
						name="fecha_inicio"
						value={form.fecha_inicio}
						onChange={change}
						className="w-full mt-1 p-2 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label className="block text-sm text-gray-300" for="ad-fin">
						Visible hasta
					</label>
					<input
						id="ad-fin"
						type="date"
						name="fecha_fin"
						value={form.fecha_fin}
						onChange={change}
						className="w-full mt-1 p-2 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
			<p className="text-xs text-gray-400">
				Déjalo vacío para que el anuncio no caduque. Antes expiraba siempre
				a los 30 días.
			</p>

			{editando && (
				<div className="flex items-center gap-2">
					<input
						id="ad-activo"
						type="checkbox"
						name="activo"
						checked={Number(form.activo) === 1}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, activo: e.target.checked ? 1 : 0 }))
						}
						className="w-4 h-4"
					/>
					<label htmlFor="ad-activo" className="text-sm text-gray-300">
						Anuncio activo
					</label>
				</div>
			)}

			<button
				type="submit"
				disabled={enviando}
				className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
				           text-white font-semibold py-2 rounded"
			>
				{enviando ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Guardar anuncio')}
			</button>

			<div className="pt-4 space-y-4">
				<Upload onUploaded={(filename) =>
					filename && setForm((prev) => ({ ...prev, imagen: filename }))
				} />
				<ImageGallery handleImageSelect={(url) =>
					setForm((prev) => ({ ...prev, imagen: url.replace(/^\/?media\//, '') }))
				} />
			</div>

			{msg && (
				<p className={`text-sm ${msg.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
					{msg.texto}
				</p>
			)}
		</form>
	);
}