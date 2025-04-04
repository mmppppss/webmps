import React from 'react'

export default class Menu extends React.Component{
	onClick(){
		console.log("clicked")
	}
	render(){
		return(
			<div className="menu">
    			<div className="showPanel" onClick={this.props.togglePanel}>
					<img  src="/media/cookie1.webp" alt="una galletita" width="60px"/>
					<span className="more">+</span>
				</div>
				<h1 className="title">mmppppss</h1>
			</div>
		)
	}
}
