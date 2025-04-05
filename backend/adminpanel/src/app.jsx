import { useState, useEffect } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import './app.css';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import { CreateArticle } from './components/Create';
const api =  import.meta.env.VITE_API_URL;
export function App() {
	const [auth, setAuth] = useState(false);
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await fetch(`${api}/is-auth`, {
					method: 'GET',
					credentials: 'include',
				});

				if (res.ok) {
					const data = await res.json();
					setAuth(data.status === "ok");
				}
			} catch (err) {
				console.error('Error al verificar autenticación', err);
				setAuth(false);
			}
		};
		checkAuth();
	});
	function EditArticle() {
		const id = window.location.pathname.split('/edit/')[1];
		return <CreateArticle articleId={id}/>;
	}
	return (
		<>
			<Router>
				<Route path="/" component={auth ? Dashboard : Login}></Route>
            	<Route path="/create" component={auth ? CreateArticle : Login}></Route>
            	<Route path="/edit/:id" component={auth ? EditArticle : Login}></Route>

			</Router>
		</>
	)
}
