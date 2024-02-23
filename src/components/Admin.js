import React from 'react'

export default function Admin(){
	return(
		<div>
			<form className="login" method="POST" action="http://localhost:3030/api.php/login">
				<label>USERNAME:</label><input type="text"  name="user" placeholder="username" />	
				<label>PASSWORD:</label><input type="password" name="pass" placeholder="*********"/>	
				<input type="submit" value="  Login  "/>	
			</form>
		</div>
	)
}
