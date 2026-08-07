import React from 'react'
import logo from '/media/cookie1.webp'
import './css/menu.css'
export default class Menu extends React.Component {
	render() {
		return (
			<div className="menu">
				<div className="showPanel" onClick={this.props.togglePanel}>
					<span class="more">
						<span class="bar"></span>
						<span class="bar"></span>
						<span class="bar"></span>
					</span>
				</div>
				<div className='logo-container'>
					<a href="/">
						<img src={logo} alt="logo" width="60px" className='logo-image' />
					</a>
					<a href="/">
						<h1 className="logo-title">{import.meta.env.VITE_SITE_NAME || 'mmppppss'}</h1>
					</a>
				</div>
			</div>
		)
	}
}
