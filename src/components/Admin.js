import React from 'react'

export default function Admin(){
	//const [username, setUsername] = useState();
	//const [password, setPassword] = useState();
	return(
		<div>
			<form className="login" method="POST" action="api.php/login">
				<label>USERNAME:</label><input type="text"  name="user" placeholder="username" />	
				<label>PASSWORD:</label><input type="password" name="pass" placeholder=" *********"/>	
				<input type="submit" value="  Login  "/>	
			</form>
		</div>
	)
}
