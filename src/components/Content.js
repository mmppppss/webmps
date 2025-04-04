import {React, useState, useEffect}  from 'react'
import ReactMarkdown from 'react-markdown'
import "../css/md.css"
export default function Content(props) {
	const [article, setArticle] = useState([]);
	const [related, setRelated] = useState([]);
	useEffect(()=>{
		fetch("/api.php/articles?enlace="+props.enlace)
			.then(response => response.json())
			.then(data => {
				if(data)setArticle(data);
				else setArticle({"nombre":"Error 404 :(","autor":"mmppppss","contenido":"Este articulo no esta disponible o no es accesible en este momento.", "enlace":"/"})
			})
			.catch(error => {
				console.log("error")
			});
		fetch("/api.php?rel="+props.enlace)
			.then(response => response.json())
			.then(data => {
				if(data)setRelated(data);
			})
			.catch(error => {
				console.log("error")
			});

// eslint-disable-next-line
	},[]);
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
		const textoRenderizado = { __html: article.contenido };
		let res=(<div>
			<h1 className="title">{article.nombre}</h1>
			<h2 className="author">by: {article.autor}</h2>
			<div className="markdown-body">
				<ReactMarkdown>{article.contenido}</ReactMarkdown>
			</div>
			{share()}
			<div className="suggest">
				<h3>Articulos relacionados</h3>
				{related.map(k=>{
					if(k.enlace===article.enlace) return null
					return <li key={k.enlace} className="relatedCard"><a href={k.enlace}>{k.nombre}</a></li>
				})}	
			</div>
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


