import {React, useState}  from 'react'

export default function Upload() {
	const [file, setFile] = useState(null);
	const [title, setTitle] = useState(null);
	function handleUpload(){
		if(!file){
			console.log("no file");
			return;
		}
		const fd = new FormData();
		fd.append('file', file);
		fd.append('title', title)
		fetch(
			'http://localhost:3030/api.php/upload',
			{
				method:"POST",
				body:fd
			}
		).then((response)=>{
			console.log(JSON.stringify(response.json));
		}).catch((error)=>{	
			console.log(error)
		})
	}
	return(
		<div className="upload">
			<input type='file' name="file" onChange={(e)=>{setFile(e.target.files[0])}}/>
			<input type='text' name="title" onChange={(e)=>{setTitle(e.target.value)}}/>
			<button type='submit' name="go" onClick={handleUpload}>Upload</button>
		</div>
	)
}
