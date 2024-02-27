import React, {useState, useEffect} from 'react';

export default function Create(props){
	const [text, setText] =  useState();
	const [title, setTitle] =  useState();
	const [author, setAuthor] =  useState();
	const [cat, setCat] = useState();
	const [link, setLink] = useState();
	const [loaded, setLoaded] = useState(false);
	if(props.link!=="" && props.link && !loaded){
		fetch('http://localhost:3030/api.php?art='+props.link)
			.then(response=>response.json())
			.then(data=>{
				if(data==null) return
				setLoaded(true);
				let titleInput=document.querySelector(".titleInput");
				let textInput=document.querySelector(".textInput");
				let authorInput=document.querySelector(".authorInput");
				let linkInput=document.querySelector(".linkInput");
				let catInput=document.querySelector(".catInput");
				textInput.value=data.content;
				titleInput.value=data.title;
				authorInput.value=data.author;
				linkInput.value=data.link;
			})
	}
	function save(){
		const FD = new FormData();
		FD.append("title", title);
		FD.append("author", author);
		FD.append("content", text);
		FD.append("cat", cat);
		FD.append("link", link);
		if(props.link!=="" && props.link){
			fetch('http://localhost:3030/api.php?del='+props.link)
		}
		fetch("http://localhost:3030/api.php/create",{
			method:"POST",
			body: FD
		})
	}
	return(<div className="saveForm">
			<textarea onChange={(e)=>{setText(e.target.value)}} onLoad={(e)=>{setText(e.target.value)}} type="text" name="content" placeholder="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet." className="textInput"/>
			<input onChange={(e)=>{setTitle(e.target.value)}} onLoad={(e)=>{setTitle(e.target.value)}} type="text" name="title" placeholder="Title" className="titleInput"/>
			<input onChange={(e)=>{setAuthor(e.target.value)}} type="text" name="author" placeholder="author" className="authorInput"/>
			<input onChange={(e)=>{setLink(e.target.value)}} type="text" name="link" placeholder="link" className="linkInput"/>
			<select onChange={(e)=>{setCat(e.target.value)}} name="cat" className="catInput">
				<option value="programming">programming</option>
				<option value="hacking">hacking</option>
				<option value="another">another</option>
			</select>
			<button onClick={save}>Save</button>
		</div>)
}
