import { useState, useEffect } from 'preact/hooks';
import './app.css';
import Login from './components/login';
import Dashboard from './components/Dashboard';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Raíz del panel.
 *
 * Antes solo comprobaba `res.ok` en /is-auth e ignoraba el cuerpo de la
 * respuesta: un 401 con la sesión caducada se interpretaba como autenticado,
 * y el panel entraba sin sesión y fallaba al guardar cualquier cosa.
 */
export function App() {
	const [auth, setAuth] = useState(null);

	useEffect(() => {
		let cancelado = false;

		const checkAuth = async () => {
			try {
				const res = await fetch(`${api}/is-auth`, {
					method: 'GET',
					credentials: 'include',
				});

				const data = await res.json().catch(() => ({}));

				if (!cancelado) {
					setAuth(res.ok && data.status === 'ok');
				}
			} catch (err) {
				console.error('Error al verificar autenticación', err);
				if (!cancelado) setAuth(false);
			}
		};

		checkAuth();
		return () => { cancelado = true };
	}, []);

	const logout = async () => {
		try {
			await fetch(`${api}/logout`, {
				method: 'POST',
				credentials: 'include',
			});
		} catch (err) {
			console.error(err);
		}
		setAuth(false);
	};

	if (auth === null) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<p className="text-gray-400">Verificando autenticación…</p>
			</div>
		);
	}

	if (!auth) {
		return <Login onSuccess={() => setAuth(true)} />;
	}

	return <Dashboard onLogout={logout} />;
}