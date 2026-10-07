import { useEffect, useState } from 'preact/hooks';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Gestion de categorias almacenadas en la tabla `categorias`.
 * Antes las opciones eran 3 <option> hardcodeados en Create.jsx y el nombre
 * no venia de ningun sitio, por lo que no se podian anadir ni renombrar.
 */
export default function CategoryManager({ onChanged }) {
	const [categorias, setCategorias] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const [msg, setMsg] = useState(null);
	const [nueva, setNueva] = useState('');
	const [editando, setEditando] = useState(null); // { id, nombre }
	const [nombreEditado, setNombreEditado] = useState('');
	const [ocupado, setOcupado] = useState(false);

	const cargar = async () => {
		try {
			const res = await fetch(`${api}/categorias`, { credentials: 'include' });
			if (!res.ok) throw new Error('No autorizado');
			const data = await res.json();
			setCategorias(Array.isArray(data) ? data : []);
			setError(null);
		} catch (err) {
			console.error(err);
			setError('No se pudieron cargar las categorías.');
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargar();
	}, []);

	const crear = async (e) => {
		e.preventDefault();
		const nombre = nueva.trim();
		if (!nombre) return;

		setOcupado(true);
		setMsg(null);
		try {
			const res = await fetch(`${api}/categorias`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ nombre }),
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setMsg({ tipo: 'error', texto: data.message || 'No se pudo crear' });
				return;
			}

			setNueva('');
			setMsg({ tipo: 'ok', texto: `Categoría "${data.nombre}" creada` });
			await cargar();
			if (onChanged) onChanged();
		} finally {
			setOcupado(false);
		}
	};

	const renombrar = async (id) => {
		const nombre = nombreEditado.trim();
		if (!nombre || nombre === editando.nombre) {
			setEditando(null);
			return;
		}

		setOcupado(true);
		try {
			const res = await fetch(`${api}/categorias/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ nombre }),
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setMsg({ tipo: 'error', texto: data.message || 'No se pudo renombrar' });
				return;
			}

			setEditando(null);
			setMsg({ tipo: 'ok', texto: 'Categoría renombrada' });
			await cargar();
			if (onChanged) onChanged();
		} finally {
			setOcupado(false);
		}
	};

	const eliminar = async (cat) => {
		if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
		try {
			const res = await fetch(`${api}/categorias/${cat.id}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				setMsg({
					tipo: 'error',
					texto: data.message || 'No se pudo eliminar (tiene artículos asociados)',
				});
				return;
			}

			setMsg({ tipo: 'ok', texto: 'Categoría eliminada' });
			await cargar();
			if (onChanged) onChanged();
		} catch (err) {
			setMsg({ tipo: 'error', texto: 'Error de red o del servidor' });
		}
	};

	return (
		<div className="p-4 max-w-2xl">
			<h1 className="text-2xl font-semibold mb-6">Categorías</h1>

			<form onSubmit={crear} className="flex gap-2 mb-6">
				<input
					type="text"
					value={nueva}
					onInput={(e) => setNueva(e.target.value)}
					placeholder="Nombre de la nueva categoría"
					className="flex-1 p-2 border rounded-md bg-gray-800 text-gray-100"
					maxLength={50}
				/>
				<button
					type="submit"
					disabled={ocupado || !nueva.trim()}
					className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
					           text-white px-4 py-1 rounded"
				>
					Crear
				</button>
			</form>

			{msg && (
				<p className={`mb-4 text-sm ${msg.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
					{msg.texto}
				</p>
			)}

			{cargando && <p className="text-gray-400">Cargando...</p>}
			{error && <p className="text-red-400">{error}</p>}

			<ul className="space-y-2">
				{categorias.map((cat) => (
					<li key={cat.id}
						className="flex items-center justify-between gap-3 p-3
						           border border-gray-700 rounded bg-gray-800">
						{editando && editando.id === cat.id ? (
							<div className="flex gap-2 flex-1">
								<input
									type="text"
									value={nombreEditado}
									onInput={(e) => setNombreEditado(e.target.value)}
									maxLength={50}
									className="flex-1 p-2 border rounded-md bg-gray-700 text-gray-100"
									// eslint-disable-next-line jsx-a11y/no-autofocus
									autofocus
								/>
								<button
									onClick={() => renombrar(cat.id)}
									disabled={ocupado}
									className="bg-green-600 hover:bg-green-700 disabled:opacity-50
									           text-white px-3 py-1 rounded"
								>
									Guardar
								</button>
								<button
									onClick={() => setEditando(null)}
									className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded"
								>
									Cancelar
								</button>
							</div>
						) : (
							<>
								<span>
									<span className="font-medium">{cat.nombre}</span>
									<span className="text-gray-500 text-sm ml-2">/{cat.slug}</span>
									<span className="text-gray-500 text-sm ml-2">
										{cat.articulos} artículo{Number(cat.articulos) === 1 ? '' : 's'}
									</span>
								</span>
								<span className="flex gap-2">
									<button
										onClick={() => {
											setEditando(cat);
											setNombreEditado(cat.nombre);
										}}
										className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
									>
										Renombrar
									</button>
									<button
										onClick={() => eliminar(cat)}
										className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
									>
										Eliminar
									</button>
								</span>
							</>
						)}
					</li>
				))}
			</ul>

			<p className="text-xs text-gray-500 mt-6">
				Una categoría con artículos no se puede eliminar: primero mueve o
				elimina sus artículos.
			</p>
		</div>
	);
}