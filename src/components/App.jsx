import { Component } from 'react';
import Content from './Content';
import { Menu, Footer, Panel } from './parts';
import { Card, Rel } from './cards';

/**
 * Enlace del sitio público.
 *
 * Antes sacaba la ruta de `window.location.href.split("/")[3].replace("?i=1", "")`:
 *   - con query strings distintas de ?i=1 la ruta quedaba contaminada
 *   - sin history API el botón "atrás" del navegador salía del sitio
 *   - `.replace()` sobre undefined lanza si la URL es solo "/"
 *   - togglePanel manipulaba el DOM a mano y crasheaba si .panel no existía
 */
export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { route: getRoute() };
		this.togglePanel = this.togglePanel.bind(this);
		this.onPopState = this.onPopState.bind(this);
	}

	componentDidMount() {
		window.addEventListener('popstate', this.onPopState);

		// En pantallas grandes el panel arranca abierto: es barra lateral y
		// desplaza el contenido. El mismo breakpoint que usa panel.css.
		if (window.innerWidth >= 1200) this.togglePanel();
	}

	componentWillUnmount() {
		window.removeEventListener('popstate', this.onPopState);
	}

	onPopState() {
		this.setState({ route: getRoute() });
	}

	togglePanel() {
		const main = document.getElementById('main');
		const panel = document.querySelector('.panel');
		const more = document.querySelector('.more');
		const bvoid = document.querySelector('.void');
		if (!panel || !more || !bvoid) return;

		const abierto = panel.classList.toggle('panelOpen');
		// En pantallas grandes este mismo estado añade el padding que
		// desplaza el contenido (ver panel.css): el panel empuja, no tapa.
		if (main) main.classList.toggle('panel-abierto', abierto);
		bvoid.style.display = abierto ? 'block' : 'none';
		more.classList.toggle('open', abierto);
	}

	content() {
		if (this.state.route !== '') {
			return <Content enlace={this.state.route} />;
		}

		return (
			<div className="content">
				<Card />
				<Rel />
			</div>
		);
	}

	render() {
		return (
			<div id="main">
				<Menu togglePanel={this.togglePanel} />
				<Panel />
				<div
					className="void"
					onClick={this.togglePanel}
					aria-hidden="true"
					style={{ display: 'none' }}
				/>
				{this.content()}
				<hr />
				<Footer />
			</div>
		);
	}
}

/** Extrae el slug de la URL sin depender de posiciones fijas del array. */
function getRoute() {
	if (typeof window === 'undefined') return '';

	const path = window.location.pathname.replace(/^\/+|\/+$/g, '');

	if (path === '' || path === 'index.html') return '';

	return decodeURIComponent(path);
}