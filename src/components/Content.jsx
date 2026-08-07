import { React, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { /*Head,*/ Loader, Share } from './parts'
import { Rel } from './cards'
import gfm from 'remark-gfm'
import "../css/md.css"
import useFetch from './utils/useFetch';
import Comment from './parts/Comment'
export default function Content(props) {
	const { data: article, error, loading } = useFetch(`art/${props.enlace}`);

	if (loading) return <p>Cargando...</p>;
	if (error) return <p>{error}</p>
	if (!article) {
		return <Loader />;
	}

	function generate() {
		let res = (<div>
			<h1 className="title">{article.titulo}</h1>
			<h2 className="author">by: {article.author}</h2>
			<div className="info">
				<span>views: {article.vistas} </span><span className='separator'> | </span>
				<span> {article.categoria} </span> <span className='separator'> | </span>
				<span> {article.fecha} </span>
			</div>
			<div className="markdown-body">
				<ReactMarkdown remarkPlugins={[gfm]} components={{
					img: ({ node, ...props }) => (
						<figure >
							<img {...props} />
							{props.alt && (
								<figcaption >
									{props.alt}
								</figcaption>
							)}
						</figure>
					)
				}} >{article.contenido}</ReactMarkdown>
			</div>
			<Comment id={article.id} />
			<Share article={article} />
			<Rel limit={3} enlace={article.enlace} />
		</div>
		)
		return (res);
	}
	if (article) {
		return (
			<div className="content">
				{generate()}
			{/*<Head {...article} />*/}
			</div>
		)
	}
}
