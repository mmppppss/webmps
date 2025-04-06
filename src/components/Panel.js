import React, { useState, useEffect }  from 'react'
import Search from './search'

const api = process.env.REACT_APP_API_URL;
export default function Panel(){
	const [list, setList] = useState([]);
	useEffect(() => {
		fetch(`${api}/arts`)
			.then(response => response.json())
			.then(data => {
				setList(data)
			})
			.catch(error => {
				console.error('Ha ocurrido un error:', error);
			});

	},[]);	

	function toggleTree(e){
		const parentLi = e.target.parentNode;
		const childUl = parentLi.querySelector('ul');
		if (childUl) {
			childUl.hidden = !childUl.hidden;
		}
	};

	function groupArticlesByCategory() {
	  const categories = Array.from(new Set(list.map(art => art.categoria))).sort();

	  const groupedArticles = categories.map(category => {
		const articlesInCategory = list.filter(art => art.categoria === category);

		return (
		  <li key={category}>
			<span>{category}</span>
			<ul>
			  {articlesInCategory.map(art => (
				<li key={art.id}>
				  <span><a href={"/" + art.enlace}>{art.titulo}</a></span>
				</li>
			  ))}
			</ul>
		  </li>
		);
	  });

	  return groupedArticles;
	}
	return (	
		<div className="panel" id="panel">
			<Search/>
			<div className="tree" >
				<ul>
					<li><span>/</span></li>
					<ul onClick={toggleTree}>
						<li><span><a href="/">index</a></span></li>
						<li>
							<span>Articulos/</span>
							<ul>
								{groupArticlesByCategory()}
							</ul>
						</li>

					</ul>
				</ul>
				
			</div>
			<div className="footer">
				<a href="https://github.com/mmppppss">GH</a>
				<a href="https://facebook.com/mmppppss">FB</a>
				<a href="https://ig.me/mmppppss">IG</a>
			</div>
		</div>
	);
}
