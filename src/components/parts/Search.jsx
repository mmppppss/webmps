import { useState, useEffect } from 'react';
import './css/search.css'
export default function Search({ articulos }) {
    const [term, setTerm] = useState('');
    const [articulosFiltrados, setArticulosFiltrados] = useState(articulos);

    useEffect(() => {
        const q = term.toLowerCase().trim();
        const filtrados = articulos.filter((art) =>
            (art.titulo && art.titulo.toLowerCase().includes(q)) ||
            (art.descripcion && art.descripcion.toLowerCase().includes(q)) ||
            (art.contenido && art.contenido.toLowerCase().includes(q))
        );
        setArticulosFiltrados(filtrados);
    }, [term, articulos]);

    return (
        <div className="search-container">
            <input
                type="text"
                placeholder="Buscar..."
                className="search-input"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
			{ term !== '' &&
            <div className="results-panel">
                {articulosFiltrados.map((art, index) => (
                    <a href={art.enlace} key={index} className="result-item">
                        <h4>{art.titulo}</h4>
                        <p>{art.descripcion}</p>
                    </a>
                ))}
            </div>}
        </div>
    );
}
