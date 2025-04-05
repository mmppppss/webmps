import { useEffect, useState } from 'preact/hooks';
import ArticleCard from './ArticleCard';
const api =  import.meta.env.VITE_API_URL;
export default function Dashboard() {
    const [articulos, setArticulos] = useState([]);

    useEffect(() => {
        fetch(`${api}/arts`, {
            credentials: 'include',
        })
			.then((res) => res.json())
			.then(setArticulos)
			.catch((err) => console.error('Error cargando artículos:', err));
    }, []);

    const eliminarArticulo = (id) => {
        if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;

        fetch(`${api}/art/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        })
            .then(() => {
                setArticulos((prev) => prev.filter((art) => art.id !== id));
            })
            .catch((err) => console.error('Error al eliminar:', err));
    };
	console.log(articulos);
    return (
		<div className="p-4">
			<div className="flex justify-between mb-10">
				<h1 className="text-2xl font-semibold ">Artículos</h1>
				
				<button
					onClick={() => window.location.href = '/create'}
					className="bg-blue-500 text-white px-3 py-1 rounded"
				>
					Crear
				</button>
			</div>
			{articulos.map((art) => (
				<ArticleCard
					key={art.id}
					article={art}
					onDelete={eliminarArticulo}
				/>
			))}
		</div>
    	
	);
}

