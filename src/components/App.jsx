import React from 'react'
import Content from './Content';
import {Menu, Footer, Loader, Panel} from './parts';
import {Card, Rel} from './cards';
export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			article: {},
			route: window.location.href.split("/")[3].replace("?i=1", ""),
		};
	}
	togglePanel() {
		const panel = document.querySelector(".panel");
		const more = document.querySelector(".more");
		const bvoid = document.querySelector(".void");
		if (panel.classList.contains("panelOpen")) {
			panel.classList.remove("panelOpen");
			bvoid.style.display = "none";
			more.classList.remove("open");
		} else {
			panel.classList.add("panelOpen");
			bvoid.style.display = "block";
			more.classList.add("open");
		}
	}
	content() {
		if (this.state.route !== "") {
			return (<Content enlace={this.state.route} />)
		} else {
			return (<div className="content">
				<Card/>
				<Rel />
			</div>)
		}
	}
	render() {
		return (
			<div id="main">
				<Menu togglePanel={this.togglePanel} />
				<Panel list={this.state.list} />
				<div className="void" onClick={this.togglePanel}>esto es un bloque vacio que ni se muestra pero tiene uso, hola</div>
				{this.content()}
				<hr />
				<Footer />
			</div>
		);
	}
}
