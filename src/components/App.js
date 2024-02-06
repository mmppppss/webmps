import React from 'react'
import Menu from './menu'
import Panel from "./Panel"
export default class App extends React.Component{
	render() {
		return(
			<div id="main">
				<Menu/>
				<h1>hola</h1>	
				<span>hola</span>
				<form>
					<label>NAME:</label><input type="text" placeholder="null"/>
				</form>
				<a href="#null">null</a>
				<Panel/>
			</div>
		);
	}
}
