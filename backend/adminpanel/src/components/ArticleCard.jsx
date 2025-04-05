export default function ArticleCard({ article, onDelete, onEdit }) {
    const { id, titulo, categoria, fecha, enlace } = article;

    return (
        <div className="p-4 border rounded shadow flex flex-col gap-2 mb-4 border-gray-700">
            <div className="flex justify-between items-center">
                <div className="mr-9">
                    <h2 className="text-lg font-semibold">{titulo}</h2>
                    <p className="text-sm text-gray-500">{categoria} | {fecha}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.href = `/${enlace}`}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                        Ver
                    </button>
                    <button
                        onClick={() => onEdit(id)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => onDelete(id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
