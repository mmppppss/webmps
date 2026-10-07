import { useState, useEffect } from 'preact/hooks';
import ReactMarkdown from 'react-markdown'; // funciona vía el alias de @preact/preset-vite
import ImageGallery from './ImageGallery'
import Upload from './Upload'
import './md.css'

const api = import.meta.env.VITE_APP_API_URL;

// slug en vivo: refleja lo que el backend hara con el titulo
function slugify(texto) {
	return (texto || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'articulo'
}

const EMPTY = {
	titulo: '',
	categoria: '',
	enlace: '',
	contenido: '',
	descripcion: '',
	img: '',
}

export function CreateArticle({ articleId, onSaved }) {
	const [formData, setFormData] = useState(EMPTY);
	const [preview, setPreview] = useState('');
	const [categorias, setCategorias] = useState([]);
	const [nuevaCategoria, setNuevaCategoria] = useState('');
	const [creandoCategoria, setCreandoCategoria] = useState(false);
	const [msg, setMsg] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [slugEditado, setSlugEditado] = useState(false);

	// ── Categorias desde la DB ─────────────────────────────────────────────
	const cargarCategorias = async () => {
		try {
			const res = await fetch(`${api}/categorias`, { credentials: 'include' })
			const data = await res.json()
			if (Array.isArray(data)) setCategorias(data)
		} catch (err) {
			console.error('Error cargando categorías:', err)
		}
	}

	useEffect(() => {
		cargarCategorias()
	}, [])

	// Cargar artículo si estamos en modo edición
	useEffect(() => {
		const fetchArticle = async () => {
			if (articleId) {
				const response = await fetch(`${api}/art/id/${articleId}`, {
					credentials: 'include',
				})
				if (response.ok) {
					const article = await response.json()
					setFormData({
						titulo: article.titulo || '',
						categoria: article.categoria || '',
						enlace: article.enlace || '',
						contenido: article.contenido || '',
						descripcion: article.descripcion || '',
						img: article.img || '',
					})
					setSlugEditado(true) // el enlace ya viene del servidor
					setPreview((article.contenido || '').replaceAll("\(media", "(../media"))
				} else {
					setMsg({ tipo: 'error', texto: 'No se pudo cargar el artículo' })
				}
			}
		}

		fetchArticle()
	}, [articleId])

	// ── El slug se autogenera del título hasta que se edite a mano ────────
	useEffect(() => {
		if (slugEditado || articleId) return
		setFormData((prev) => ({ ...prev, enlace: slugify(prev.titulo) }))
	}, [formData.titulo, slugEditado, articleId])

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		if (name === 'contenido') {
			setPreview(value.replaceAll("\(media", "(../media"))
		}
	}

	const handleImageSelect = (image) => {
		const img = `\n![](${image})`
		setFormData((prev) => ({
			...prev,
			contenido: prev.contenido + img,
		}))
		setPreview((prev) => prev + img.replaceAll("\(media", "(../media"))
	}

	const handlePortadaUploaded = (filename) => {
		if (filename) setFormData((prev) => ({ ...prev, img: filename }))
	}

	// ── Crear una categoría nueva sin salir del formulario ─────────────────
	const handleCreateCategory = async (e) => {
		e.preventDefault()
		const nombre = nuevaCategoria.trim()
		if (!nombre || creandoCategoria) return

		setCreandoCategoria(true)
		try {
			const res = await fetch(`${api}/categorias`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ nombre }),
			})
			const data = await res.json()

			if (!res.ok) {
				setMsg({ tipo: 'error', texto: data.message || 'No se pudo crear la categoría' })
				return
			}

			await cargarCategorias()
			setFormData((prev) => ({ ...prev, categoria: data.nombre }))
			setNuevaCategoria('')
			setMsg({ tipo: 'ok', texto: `Categoría "${data.nombre}" creada` })
		} catch (err) {
			setMsg({ tipo: 'error', texto: 'Error de red o del servidor' })
		} finally {
			setCreandoCategoria(false)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (enviando) return

		if (!formData.categoria) {
			setMsg({ tipo: 'error', texto: 'Elige o crea una categoría' })
			return
		}

		setEnviando(true)
		setMsg(null)

		const url = articleId ? `${api}/art/update/${articleId}` : `${api}/art/create`

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(formData),
			})

			const data = await response.json().catch(() => ({}))

			if (!response.ok) {
				setMsg({ tipo: 'error', texto: data.message || 'Hubo un error al procesar el artículo' })
				return
			}

			setMsg({ tipo: 'ok', texto: articleId ? 'Artículo actualizado' : 'Artículo creado' })
			if (onSaved) onSaved(data)
			else window.location.href = '/panel/'
		} catch (err) {
			setMsg({ tipo: 'error', texto: 'Error de red o del servidor' })
		} finally {
			setEnviando(false)
		}
	}

	return (
		<div className="container mx-auto max-w-full p-4">

			<div className="flex justify-between items-center mb-10">
				<h1 className="text-3xl text-center font-bold">
					{articleId ? 'Editar artículo' : 'Crear nuevo artículo'}
				</h1>
				<button type="button" className="bg-blue-500 text-white px-3 py-1 rounded"
					onClick={() => { window.location.href = '/panel/' }}>
					Dashboard
				</button>
			</div>

			{msg && (
				<div className={`mb-4 p-3 rounded ${msg.tipo === 'ok'
					? 'bg-green-900 text-green-200'
					: 'bg-red-900 text-red-200'}`}>
					{msg.texto}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Formulario */}
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="titulo" className="block text-lg">Título</label>
						<input
							type="text"
							id="titulo"
							name="titulo"
							value={formData.titulo}
							onChange={handleChange}
							className="w-full p-2 border rounded-md"
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Categoría: viene de la DB */}
						<div>
							<label htmlFor="categoria" className="block text-lg">Categoría</label>
							<select
								id="categoria"
								name="categoria"
								value={formData.categoria}
								onChange={handleChange}
								required
								className="w-full p-2 border rounded-md"
							>
								<option value="" disabled>Selecciona una categoría</option>
								{categorias.map((c) => (
									<option key={c.id} value={c.nombre}>
										{c.nombre} ({c.articulos})
									</option>
								))}
								<option value="__nueva__">+ Crear categoría nueva…</option>
							</select>

							{formData.categoria === '__nueva__' && (
								<div className="mt-2 flex gap-2">
									<input
										type="text"
										value={nuevaCategoria}
										onInput={(e) => setNuevaCategoria(e.target.value)}
										placeholder="Nombre de la categoría"
										className="w-full p-2 border rounded-md"
										// eslint-disable-next-line jsx-a11y/no-autofocus
										autofocus
									/>
									<button
										type="button"
										onClick={handleCreateCategory}
										disabled={creandoCategoria || !nuevaCategoria.trim()}
										className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
										           text-white px-3 py-1 rounded whitespace-nowrap"
									>
										{creandoCategoria ? '...' : 'Crear'}
									</button>
								</div>
							)}

							<p className="text-xs text-gray-400 mt-1">
								Las categorías se guardan en la base de datos.
							</p>
						</div>

						<div>
							<label htmlFor="enlace" className="block text-lg">Enlace</label>
							<input
								type="text"
								id="enlace"
								name="enlace"
								value={formData.enlace}
								onChange={(e) => { setSlugEditado(true); handleChange(e) }}
								className="w-full p-2 border rounded-md"
								required
							/>
							<p className="text-xs text-gray-400 mt-1">
								/article/{formData.enlace}
							</p>
						</div>
					</div>

					<div>
						<label htmlFor="descripcion" className="block text-lg">Descripción</label>
						<input
							type="text"
							id="descripcion"
							name="descripcion"
							value={formData.descripcion}
							onChange={handleChange}
							className="w-full p-2 border rounded-md"
							required
						/>
						<p className="text-xs text-gray-400 mt-1">
							{formData.descripcion.length}/300 caracteres · aparece en buscadores y al compartir
						</p>
					</div>

					<div>
						<label htmlFor="img" className="block text-lg">Imagen de portada</label>
						<input
							type="text"
							id="img"
							name="img"
							value={formData.img}
							onChange={handleChange}
							placeholder="media/img_xxx.webp"
							className="w-full p-2 border rounded-md"
						/>
						{formData.img && (
							<img src={`/${formData.img}`} alt="Portada"
								className="mt-2 max-h-40 rounded" />
						)}
					</div>

					<div>
						<label htmlFor="contenido" className="block text-lg">Contenido (Markdown)</label>
						<textarea
							id="contenido"
							name="contenido"
							value={formData.contenido}
							onChange={handleChange}
							className="w-full p-2 border rounded-md h-40"
							required
						/>
					</div>

					<div>
						<Upload onUploaded={handlePortadaUploaded} />
						<ImageGallery handleImageSelect={handleImageSelect} />
						<button type="submit" disabled={enviando}
							className="px-4 py-2 mt-3 bg-blue-500 hover:bg-blue-700
							           disabled:opacity-50 text-white rounded-md w-full">
							{enviando ? 'Guardando...' : (articleId ? 'Guardar cambios' : 'Crear artículo')}
						</button>
					</div>
				</form>

				{/* Vista previa */}
				<div className="mt-8">
					<h2 className="text-xl font-bold">Vista previa</h2>
					<div className="markdown-body mt-4 p-4 w-full h-full overflow-auto border rounded-md">
						<ReactMarkdown>{preview}</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	);
}