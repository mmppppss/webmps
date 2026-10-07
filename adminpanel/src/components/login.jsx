import { useState } from 'preact/hooks';

const api = import.meta.env.VITE_APP_API_URL;

/**
 * Pantalla de inicio de sesión.
 *
 * Arreglos sobre la versión anterior:
 *   - `console.log(username, password)`: imprimía la contraseña del usuario
 *     en la consola del navegador
 *   - leía `data.error` cuando la API responde `{ status, message }`, así que
 *     el mensaje real (incluido el de "demasiados intentos") nunca se veía
 *   - usaba `alert('Login correcto')` antes de redirigir
 */
export default function Login({ onSuccess }) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(`${api}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // para incluir la cookie de sesión
				body: JSON.stringify({ username, password }),
			});

			const data = await res.json().catch(() => ({}));

			if (res.ok && data.status === 'success') {
				// Sin recarga completa: el estado del App se actualiza solo
				if (onSuccess) onSuccess();
				else window.location.href = '/panel/';
				return;
			}

			setError(data.message || 'Error de autenticación');
		} catch (err) {
			setError('Error de red o del servidor. ¿La API está accesible?');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
			<div className="login-form w-full max-w-sm bg-gray-800 rounded-lg p-6">
				<h1 className="text-2xl font-semibold mb-2">Panel</h1>
				<p className="text-sm text-gray-400 mb-6">Acceso restringido</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label htmlFor="usuario" className="block text-sm text-gray-300 mb-1">
							Usuario
						</label>
						<input
							id="usuario"
							name="username"
							className="w-full border rounded p-3 bg-gray-700"
							type="text"
							autoComplete="username"
							value={username}
							onInput={(e) => setUsername(e.target.value)}
							required
						/>
					</div>

					<div>
						<label htmlFor="clave" className="block text-sm text-gray-300 mb-1">
							Contraseña
						</label>
						<input
							id="clave"
							name="password"
							className="w-full border rounded p-3 bg-gray-700"
							type="password"
							autoComplete="current-password"
							value={password}
							onInput={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
						           text-white rounded py-2 px-3"
					>
						{loading ? 'Entrando…' : 'Entrar'}
					</button>
				</form>

				{error && (
					<p role="alert" className="mt-4 text-sm text-red-400">
						{error}
					</p>
				)}
			</div>
		</div>
	);
}