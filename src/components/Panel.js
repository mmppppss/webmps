import React, { useState, useEffect }  from 'react'
import Search from './search'
export default function Panel(){
	const [list, setList] = useState([]);
	useEffect(() => {
		fetch("api.php/articles")
			.then(response => response.json())
			.then(data => {
				setList(data)
			})
			.catch(error => {
				console.error('Ha ocurrido un error:', error);
			});

	},[]);	
	function articles(categoria="null"){
		let res=list.map(art =>{
			if(art.categoria === categoria || (categoria==="null"&&(art.categoria!=="programacion" && art.categoria!=="hacking"))) return <li key={art.id}><span><a href={art.enlace}>{art.nombre}</a></span></li>
			return null;
		})
		
		return(res);	
	}
	function toggleTree(e){
		const parentLi = e.target.parentNode;
		const childUl = parentLi.querySelector('ul');
		if (childUl) {
			childUl.hidden = !childUl.hidden;
		}
	};
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
								<li><span>Prog</span>
									<ul>
										{articles("programacion")}
									</ul>
								</li>
								<li><span>hack</span>
									<ul>
										{articles("hacking")}
									</ul>
								</li>
								<li><span>otros</span>
									<ul>
										{articles()}
									</ul>
								</li>
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
