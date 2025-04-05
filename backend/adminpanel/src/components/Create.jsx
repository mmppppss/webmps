import { useState, useEffect } from 'preact/hooks';
import ReactMarkdown from 'react-markdown';
import './md.css'
const api =  import.meta.env.VITE_API_URL;
export  function CreateArticle({ articleId }) {
	const [formData, setFormData] = useState({
		titulo: '',
		categoria: 'Otro',
		enlace: '',
		contenido: '',
		descripcion: '',
	});
	const [preview, setPreview] = useState('');
	
	// Cargar artículo si estamos en modo edición
	useEffect(() => {
		const fetchArticle = async () => {
			if (articleId) {
				const response = await fetch(`${api}/art/${articleId}`);
				if (response.ok) {
					const article = await response.json();
					setFormData({
						titulo: article.titulo,
						categoria: article.categoria,
						enlace: article.enlace,
						contenido: article.contenido,
						descripcion: article.descripcion,
					});
					setPreview(article.contenido);  // Para la vista previa de markdown
				} else {
					alert('No se pudo cargar el artículo');
				}
			}
		};

		fetchArticle();
	}, [articleId]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		if (name === 'contenido') {
			setPreview(value);
		}
	};


	  const handleSubmit = async (e) => {
		e.preventDefault();

		const method = articleId ? 'PUT' : 'POST';
		const url = articleId ? `${api}/art/${articleId}` : `${api}/art/create`;

		const response = await fetch(url, {
		  method: method,
		  headers: {
			'Content-Type': 'application/json',
		  },
		  credentials: 'include',
		  body: JSON.stringify(formData),
		});

		if (response.ok) {
		  alert(articleId ? 'Artículo actualizado con éxito' : 'Artículo creado con éxito');
		} else {
		  alert('Hubo un error al procesar el artículo');
		}
	  };
/*
	const handleSubmit = async (e) => {
		e.preventDefault();

		const response = await fetch(`${api}/art/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(formData),
		});

		if (response.ok) {
			alert('Artículo creado con éxito');
		} else {
			alert('Hubo un error al crear el artículo');
		}
	};*/
	return (
<div className="container mx-auto  max-w-full p-4 ">
  <div className="flex justify-between mb-10">
  <h1 className="text-3xl max-w-full text-center font-bold mb-4">{articleId ? 'Editar artículo' : 'Crear nuevo artículo'}</h1>
  <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => window.location.href = '/'}>Dashboard</button>
  </div>
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
          <option value="Programacion">Programacion</option>
          <option value="Seguridad">Ciberseguridad</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
	  <div>
        <label htmlFor="enlace" className="block text-lg">Enlace</label>
        <input
          type="text"
          id="enlace"
          name="enlace"
          value={formData.enlace}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div></div>
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
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md w-full">Crear Artículo</button>
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
