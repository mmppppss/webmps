import React from 'react'

export default class Search extends React.Component{
	render(){
		return(
			<div className="search">
				<input type='text' placeholder='search'/><input type='submit' value='go'/>
			</div>
		)
	}
}
