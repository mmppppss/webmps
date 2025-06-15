import { useState, useEffect }  from 'react'

const api = process.env.REACT_APP_API_URL;

export default function Rel() {
	const [related, setRelated] = useState([]);

	useEffect(() => {
		
	fetch(`${api}/arts`)
			.then(response => response.json())
			.then(data => {
				if(data)setRelated(data);
			})
			.catch(error => {
				console.log("error")
			});
	},[]);
	function gen(){
		return (<div className="suggest">
			  <h3>Artículos Recomendados</h3>
			  <div className="related-cards">
				{related.map(k => {
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
			</div>)
	}
	return (
		<>
			{related.length > 1 ? gen() : <span></span>}
		</>
	);
}
