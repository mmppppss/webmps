import React from 'react'

export default class Panel extends React.Component{
	constructor(props){
		super(props);
	}
	toggleTree(e){
		const parentLi = e.target.parentNode;
		const childUl = parentLi.querySelector('ul');
		if (childUl) {
			childUl.hidden = !childUl.hidden;
		}
	};
	render() {
		return (	
			<div className="panel" id="panel">
				<div className="tree" onClick={this.toggleTree}>
					<ul>
						<li><span>/</span></li>
						<ul>
							<li><span><a href="/">index</a></span></li>
							<li>
								<span>Articulos/</span>
								<ul>
									<li><span>/</span>
										<ul>
											<li><span><a href="#">hey</a></span></li>
											<li><span><a href="#">hey</a></span></li>
											<li><span><button>aaaaaaaa</button></span></li>
										</ul>
									</li>
								</ul>
							</li>
						</ul>
					</ul>	
				</div>
			</div>
		);
	}
}
