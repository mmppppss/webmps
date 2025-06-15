import {React, useState, useEffect}  from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import "../css/md.css"


const api = process.env.REACT_APP_API_URL;
export default function Content(props) {
	const [article, setArticle] = useState([]);
	const [related, setRelated] = useState([]);
	useEffect(()=>{
	    console.log("Fetching artículo:", props.enlace);
		fetch(`${api}/art/${props.enlace}`)
			.then(response => response.json())
			.then(data => {
				if(data)setArticle(data);
				else setArticle({"nombre":"Error 404 :(","autor":"mmppppss","contenido":"Este articulo no esta disponible o no es accesible en este momento.", "enlace":"/"})
			})
			.catch(error => {
				console.log("error")
			});
		fetch(`${api}/art/rel/${props.enlace}`)
			.then(response => response.json())
			.then(data => {
				if(data)setRelated(data);
			})
			.catch(error => {
				console.log("error")
			});
	},[props.enlace]);
	function share(){
		return(
			<div className="share-buttons">
			<a
			href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.nombre)}`}
			target="_blank"
			className="share-link"
			rel="noopener noreferrer"
			>
			Share on X
			</a>
			<a
			href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
			target="_blank"
			className="share-link"
			rel="noopener noreferrer"
			>
			Share on Facebook
			</a>
			<a
			href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.nombre)}`}
			target="_blank"
			className="share-link"
			rel="noopener noreferrer"
			>
			Share on LinkedIn
			</a>
			<a
			href={`mailto:?subject=${encodeURIComponent(article.nombre)}&body=${encodeURIComponent(window.location.href)}`}
			className="share-link"
			>
			Share via Email
			</a>
			<a
			href="#"
			className="share-link"
			onClick={() => {
				navigator.clipboard.writeText(article.enlace)
					.then(() => alert('Link copied to clipboard!'))
					.catch((error) => console.error('Error copying text:', error));
			}}
			>
			Copy link
			</a>
			{/* Compartir usando la API de Web Share (para dispositivos móviles) */}
			<a
			href="#"
			className="share-link"
			onClick={() => {
				if (navigator.share) {
					navigator.share({
						title: article.nombre,
						url: article.enlace
					})
						.then(() => console.log('Article shared successfully'))
						.catch((error) => console.log('Error sharing article:', error));
				} else {
					alert('Sharing is not supported on this device.');
				}
			}}
			>
			Share    </a>
			</div>
		)
	}

	function generate(){
		let res=(<div>
			<h1 className="title">{article.titulo}</h1>
			<h2 className="author">by: {article.author}</h2>
			<div className="info">
				<span>VISTAS: {article.vistas} </span><span className='separator'> | </span>
				<span>CATEGORIA: {article.categoria} </span> <span className='separator'> | </span>
				<span> {article.fecha} </span>
			</div>
			<div className="markdown-body">
				<ReactMarkdown remarkPlugins={[gfm]}>{article.contenido}</ReactMarkdown>
			</div>
			{share()}
			{related.length >= 0 ? 
		
			<div className="suggest">
			  <h3>Artículos Recomendados</h3>
			  <div className="related-cards">
				{related.map(k => {
				  if (k.enlace === article.enlace) return null; // No mostrar el artículo actual
				  return (
					<div key={k.enlace} className="relatedCard">
					  <a href={`/${k.enlace}`} className="card-link">
						<h4>{k.titulo}</h4>
						<p>{k.descripcion}</p>
					  </a>
					</div>
				  );
				})}
			  </div>
			</div>
			: <span></span>}
			</div>
		)
		return (res);
	}
	return(
		<div className="content">
			{generate()}
		</div>
	)
}


