import React, {useState, useEffect} from 'react';

export default function  Read(props){
	const [list, setList] = useState([]);
	const [art, setArt] = useState();
	useEffect(() => {
		if(!props.link){
			fetch('/api.php/articles')
			.then(response=>response.json())
			.then(data=>{
				setList(data);
			})
		}else{
			fetch('/api.php?art='+props.link)
			.then(response=>response.json())
			.then(data=>{
				setArt(data);
			})
		}
	},[]);
	function del(link){
		fetch('/api.php?del='+link)
	}
	function generate(){
		let res;
		if(list.length>0){
			res=(<table>
				<tbody>
				<tr><th>Title</th><th>Author</th><th>Options</th></tr>
					{list.map(k=>{
						return <tr key={k.enlace}><td>{k.nombre}</td><td>{k.autor}</td><td><a href={k.enlace}>👁️</a><a href={"/update/"+k.enlace}>📝️</a><button onClick={(e)=>{del(k.enlace)}}>🗑️</button></td></tr>
					})}
				</tbody>
			</table>)
		}else if(art){
			res=(
				<div>
					<h1>{art.nombre}</h1>
					<span>by: {art.autor}</span>
					<p>{art.contenido}</p>
				</div>
			)
		}
		return res;
	}
	return(
		<div className="readList" >
			{generate()}
		</div>
	)
}
