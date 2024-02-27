import React, {useState} from 'react'
import Read from './Read'
import Create from './Create'

export default function Admin(){
	const [route] = useState(window.location.href.split("/")[4]);
	function generate(){
		console.log(route)
		if(route==="create"){
			return <Create/>
		}else if(route==="read"){
			return <Read/>
		}else if(route==="update"){
			return <Create link={window.location.href.split("/")[4]}/>
		}else if(route===""){
			return <p><a href="create">create</a><a href="read">Read</a></p>
		}else if(route!=="read" || route!=="create"){
			return <Read link={route}/>
		}
	}
	return(
		<div>
			{generate()}
		</div>
	)
}
