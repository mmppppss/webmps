import React from 'react'
import Menu from './menu'
import Panel from "./Panel"
import Admin from './Admin' 
import Content from './Content'
export default class App extends React.Component{
	constructor(props) {
		super(props);
		this.state = {
			article:{},
			route: window.location.href.split("/")[3]
		};
		console.log(this.state.route)
	}
	togglePanel(){
		const panel = document.querySelector(".panel");
		const more = document.querySelector(".more");
		const bvoid = document.querySelector(".void");
		if (panel.classList.contains("panelOpen")) {
			panel.classList.remove("panelOpen");
			bvoid.style.display = "none";
			more.innerText = "+";
		} else {
			panel.classList.add("panelOpen");
			bvoid.style.display = "block";
			more.innerText = "-";
		}
	}
	content(){
		if(this.state.route=="admin"){
			return <Admin/>	
		}else if(this.state.route!==""){
			return(<Content enlace={this.state.route}/>)	
		}else{
			return(<div className="content">
				<h1>hola</h1>
				<span>hola</span>
				<a href="/hola">null</a>
				<h1>hola</h1>	
				<h1>hola</h1>	
			</div>)
		}
	}
	render() {
		return(
			<div id="main">
				<Menu togglePanel={this.togglePanel}/>
				<Panel list={this.state.list}/>	
				<div className="void" onClick={this.togglePanel}>esto es un bloque vacio que ni se muestra pero tiene uso, hola</div>
				{this.content()}	
			</div>
		);
	}
}
