import { useEffect, useState } from 'preact/hooks';
import ArticleCard from './ArticleCard';
import { CreateArticle } from './Create';
import AdForm from './AdForm';
import AdList from './AdList';
import CategoryManager from './CategoryManager';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Vistas del panel. Antes se elegia con un numero magico guardado en
 * estado (toRender = 0,1,2,3,4), lo que rompia el boton "atras" del
 * navegador y hacia imposible enlazar a una seccion concreta.
 */
const VISTAS = {
	ARTICULOS: 'articulos',
	CREAR: 'crear',
	EDITAR: 'editar',
	ANUNCIOS: 'anuncios',
	FORM_ANUNCIO: 'form-anuncio',
	CATEGORIAS: 'categorias',
};

export default function Dashboard({ onLogout }) {
	const [vista, setVista] = useState(VISTAS.ARTICULOS);
	const [articulo, setArticulo] = useState(null);
	const [anuncio, setAnuncio] = useState(null);
	const [articulos, setArticulos] = useState([]);
	const [categorias, setCategorias] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const [msg, setMsg] = useState(null);
	const [busqueda, setBusqueda] = useState('');

	const cargarArticulos = async () => {
		try {
			// /admin/arts y no /arts: el listado público solo trae publicados,
			// así que un artículo en borrador desaparecía y no se podía editar
			const res = await fetch(`${api}/admin/arts`, { credentials: 'include' });
			if (!res.ok) throw new Error('No autorizado');
			const data = await res.json();
			setArticulos(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error('Error cargando artículos:', err);
			setError('No se pudieron cargar los artículos.');
		} finally {
			setCargando(false);
		}
	};

	const cargarCategorias = async () => {
		try {
			const res = await fetch(`${api}/categorias`, { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setCategorias(Array.isArray(data) ? data : []);
			}
		} catch (err) {
			console.error('Error cargando categorías:', err);
		}
	};

	useEffect(() => {
		cargarArticulos();
		cargarCategorias();
	}, []);

	const navegar = (nueva, datos = {}) => {
		setMsg(null);
		setArticulo(datos.articulo ?? null);
		setAnuncio(datos.anuncio ?? null);
		setVista(nueva);
		window.scrollTo({ top: 0 });
	};

	const eliminarArticulo = async (id) => {
		if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;
		try {
			const res = await fetch(`${api}/art/delete/${id}`, {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.status !== 'success') {
				setMsg({ tipo: 'error', texto: data.message || 'No se pudo eliminar' });
				return;
			}
			setMsg({ tipo: 'ok', texto: 'Artículo eliminado' });
			// Recarga la lista: el borrado es lógico, así que el artículo sigue
			// en la respuesta, marcado con deleted_at
			cargarArticulos();
		} catch (err) {
			setMsg({ tipo: 'error', texto: 'Error de red o del servidor' });
		}
	};

	const alGuardarArticulo = () => {
		setMsg({ tipo: 'ok', texto: 'Guardado' });
		cargarArticulos();
		navegar(VISTAS.ARTICULOS);
	};

	const alGuardarAnuncio = () => {
		navegar(VISTAS.ANUNCIOS);
	};

	const filtrados = busqueda.trim()
		? articulos.filter((a) =>
			(a.titulo || '').toLowerCase().includes(busqueda.toLowerCase().trim())
		)
		: articulos;

	const tabs = [
		{ id: VISTAS.ARTICULOS, label: 'Artículos' },
		{ id: VISTAS.CATEGORIAS, label: 'Categorías' },
		{ id: VISTAS.ANUNCIOS, label: 'Anuncios' },
	];

	let contenido;
	if (vista === VISTAS.CREAR) {
		contenido = <CreateArticle onSaved={alGuardarArticulo} />;
	} else if (vista === VISTAS.EDITAR) {
		contenido = articulo
			? <CreateArticle key={articulo} articleId={articulo} onSaved={alGuardarArticulo} />
			: <p className="p-10 text-gray-400">No hay artículo seleccionado.</p>;
	} else if (vista === VISTAS.FORM_ANUNCIO) {
		// key: si se edita un anuncio distinto del anterior, el form debe
		// recargarse con los datos nuevos en vez de conservar el estado viejo
		contenido = (
			<AdForm key={anuncio ? anuncio.id : 'nuevo'} ad={anuncio} onSaved={alGuardarAnuncio} />
		);
	} else if (vista === VISTAS.ANUNCIOS) {
		contenido = <AdList onEditar={(ad) => navegar(VISTAS.FORM_ANUNCIO, { anuncio: ad })} />;
	} else if (vista === VISTAS.CATEGORIAS) {
		contenido = <CategoryManager onChanged={cargarCategorias} />;
	} else {
		contenido = (
			<div className="p-4">
				<div className="flex justify-between items-center mb-6 flex-wrap gap-3">
					<h1 className="text-2xl font-semibold">
						Artículos <span className="text-gray-500">({filtrados.length})</span>
					</h1>
					<button
						onClick={() => navegar(VISTAS.CREAR)}
						className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
					>
						Crear
					</button>
				</div>

				<input
					type="search"
					value={busqueda}
					onInput={(e) => setBusqueda(e.target.value)}
					placeholder="Buscar por título..."
					className="w-full p-2 border rounded-md mb-6 bg-gray-800 text-gray-100"
				/>

				{cargando && <p className="text-gray-400">Cargando...</p>}
				{error && <p className="text-red-400">{error}</p>}
				{!cargando && filtrados.length === 0 && (
					<p className="text-gray-400">
						{busqueda ? 'Ningún artículo coincide con la búsqueda.' : 'No hay artículos.'}
					</p>
				)}

				{filtrados.map((art) => (
					<ArticleCard
						key={art.id}
						article={art}
						onDelete={eliminarArticulo}
						onEdit={() => navegar(VISTAS.EDITAR, { articulo: art.id })}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-gray-100">
			<header className="border-b border-gray-700 bg-gray-800 sticky top-0 z-30">
				<div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
					<span className="font-semibold text-lg">Panel</span>
					<nav className="flex gap-1">
						{tabs.map((t) => (
							<button
								key={t.id}
								onClick={() => navegar(t.id)}
								className={`px-3 py-1 rounded ${
									vista === t.id
										? 'bg-blue-600 text-white'
										: 'text-gray-300 hover:bg-gray-700'
								}`}
							>
								{t.label}
							</button>
						))}
					</nav>
					<div className="flex gap-2">
						<a
							href="/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-gray-300 hover:text-white px-2 py-1"
						>
							Ver sitio
						</a>
						{onLogout && (
							<button
								onClick={onLogout}
								className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
							>
								Salir
							</button>
						)}
					</div>
				</div>
			</header>

			{msg && (
				<div className={`max-w-5xl mx-auto mt-4 p-3 rounded ${
					msg.tipo === 'ok' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
				}`}>
					{msg.texto}
				</div>
			)}

			<main className="max-w-5xl mx-auto">{contenido}</main>
		</div>
	);
}