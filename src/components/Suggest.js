import React, {useState, useEffect} from 'react'

export default function Suggest(){
	const [related, setRelated] = useState([]);
	useEffect(()=>{
		fetch("http://localhost:3030/api.php?rel="+window.location.pathname.slice(1))
			.then(response => response.json())
			.then(data => {
				if(data)setRelated(data);
			})
			.catch(error => {
				fetch("http://localhost:3030/api.php?rel=")
				.then(response => response.json())
				.then(data => {
					if(data)setRelated(data);
				})
			});
	// eslint-disable-next-line
	},[]);
	function generate(){
		let res=(
		<div className="suggestArts">
			{related.map(k=>{
				return <div className="related" key={k.enlace}>
					<a href={k.enlace}>{k.nombre}</a>
					<p>{k.descripcion}</p>
				</div>
				})
			}
		</div>
		)
		return (res);
	}
	return(
		<div>
			<h3>Articulos recomendados</h3>
			{generate()}
		</div>
	)
}
