import {React, useState, useEffect}  from 'react'
import Suggest from './Suggest'

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
				setArticle({"nombre":"Error 404 :(","autor":"mmppppss","contenido":"Este articulo no esta disponible o no es accesible en este momento.", "enlace":"/"})
				console.log("error")
			});
// eslint-disable-next-line
	},[]);
	function generate(){
		const textoRenderizado = { __html: article.contenido };
		let res=(<div>
			<h1>{article.nombre}</h1>
			<h2>{article.autor}</h2>
			<p dangerouslySetInnerHTML={textoRenderizado}>
			</p>
			<a href={article.enlace}>share</a>
			<Suggest/>	
		</div>)
		return (res);
	}
	return(
		<div className="content">
			{generate()}
		</div>
	)
}


