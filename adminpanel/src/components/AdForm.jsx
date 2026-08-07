import { useState } from 'react';
import Upload from './Upload';
import ImageGallery from './ImageGallery';
const api = import.meta.env.VITE_APP_API_URL;
export default function AdForm() {
	const [titulo, setTitulo] = useState('');
	const [imagen, setImagen] = useState('');
	const [enlace, setEnlace] = useState('');
	const [ubicacion, setUbicacion] = useState('');
	const [descripcion, setDescripcion] = useState('');
	const [prioridad, setPrioridad] = useState(2);
	const [msg, setMsg] = useState('');
	const handleSubmit = async (e) => {
		e.preventDefault();
		setMsg("Guardando...");

		try {
			const response = await fetch(`${api}/ad/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include', body: JSON.stringify({
					titulo,
					imagen,
					enlace,
					ubicacion,
					descripcion,
					prioridad
				}),
			});

			const result = await response.json();
			if (response.ok) {
				setMsg("Anuncio guardado correctamente.");
				setTitulo('');
				setImagen('');
				setEnlace('');
				setUbicacion('');
				setDescripcion('');
			} else {
				setMsg("Error al guardar: " + result.message);
			}
		} catch (err) {
			console.error(err);
			setMsg("Error al conectar con el servidor");
		}
	};

	return (

		<form
			onSubmit={handleSubmit}
			className="bg-gray-800 text-gray-200 p-6 rounded-lg shadow-md space-y-4 w-full max-w-lg mx-auto"
		>
			<h2 className="text-2xl font-bold text-blue-400 text-center">Crear anuncio</h2>

			<input
				type="text"
				placeholder="Título"
				value={titulo}
				onChange={(e) => setTitulo(e.target.value)}
				required
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<input
				type="text"
				placeholder="Imagen (URL)"
				value={imagen}
				onChange={(e) => setImagen(e.target.value)}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<input
				type="text"
				placeholder="Enlace (opcional)"
				value={enlace}
				onChange={(e) => setEnlace(e.target.value)}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<input
				type="text"
				placeholder="Ubicación"
				value={ubicacion}
				onChange={(e) => setUbicacion(e.target.value)}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<textarea
				placeholder="Descripción"
				value={descripcion}
				onChange={(e) => setDescripcion(e.target.value)}
				className="w-full p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				rows="4"
			/>

			<label className="block text-sm text-gray-300">
				Prioridad:
				<select
					value={prioridad}
					onChange={(e) => setPrioridad(e.target.value)}
					required
					className="w-full mt-1 p-2 rounded bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="1">Alta (Grande)</option>
					<option value="2">Media (Imagen)</option>
					<option value="3">Baja (Cinta)</option>
				</select>
			</label>

			<button
				type="submit"
				className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
			>
				Guardar anuncio
			</button>

			<div className="pt-4 space-y-4">
				<Upload />
				<ImageGallery handleImageSelect={setImagen} />
			</div>

			{msg && <p className="text-green-400 text-sm">{msg}</p>}
		</form>

	);
}
