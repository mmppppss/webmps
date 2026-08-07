import { useEffect, useState } from 'preact/hooks';
import ArticleCard from './ArticleCard';
import { CreateArticle } from './Create';
import AdForm from './AdForm'
import AdList from './AdList'

const api = import.meta.env.VITE_APP_API_URL;
export default function Dashboard() {
	const [articulos, setArticulos] = useState([]);
	const [toRender, setToRender] = useState(0);
	const [articulo, setArticulo] = useState(null);
	useEffect(() => {
		fetch(`${api}/arts`, {
			credentials: 'include',
		})
			.then((res) => res.json())
			.then(setArticulos)
			.catch((err) => console.error('Error cargando artículos:', err));
	}, [toRender]);

	const eliminarArticulo = (id) => {
		if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;
		fetch(`${api}/art/delete/${id}`, {
			method: 'POST',
			headers: {
				'X-HTTP-Method-Override': 'DELETE',
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		}).then(
			(res) => {
				alert("Articulo eliminado");
				setArticulos(articulos.filter((art) => art.id !== id));
				setToRender(0);
			})
			.catch((err) => console.error('Error al eliminar:', err));
	};

	function EditArticle() {
		if (articulo != null) {
			return <CreateArticle articleId={articulo} />;
		}
	}
	function onEdit(art) {
		setArticulo(art);
		setToRender(2);
	}
	function render() {
		if (toRender === 0) { //Dashboard
			return (
				<div className="p-4">
					<div className="flex justify-between mb-10">
						<h1 className="text-2xl font-semibold ">Artículos</h1>

						<button
							onClick={() => setToRender(1)}
							className="bg-blue-500 text-white px-3 py-1 rounded"
						>
							Crear
						</button>

						<button
							onClick={() => setToRender(4)}
							className="bg-blue-500 text-white px-3 py-1 rounded"
						>
							Anuncios
						</button>
					</div>
					{articulos.map((art) => (
						<ArticleCard
							onEdit={onEdit}
							key={art.id}
							article={art}
							onDelete={eliminarArticulo}
						/>
					))}
				</div>)
		} else if (toRender === 1) {//create
			return <CreateArticle />
		} else if (toRender === 2) {
			return <EditArticle />
		} else if (toRender === 3) {
			return <AdForm />
		} else if (toRender == 4) {
			return <AdList setToRender={setToRender} />
		}
	}
	return (
		<>
			{render()}
		</>
	);
}

