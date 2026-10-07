import { useState, useEffect } from 'preact/hooks';

/**
 * Hook de fetch para el panel.
 *
 * La versión anterior estaba ROTA:
 *   - `loadData()` usaba `response` fuera de su ámbito (ReferenceError)
 *   - importaba de 'react' en un proyecto Preact
 *   - hacía un `ping()` extra a la raíz de la API antes de cada petición
 *   - declaraba un estado `connected` que nunca devolvía
 *   - no enviaba `credentials`, así que la sesión no viajaba
 *
 * Los componentes ya no lo usan (usan fetch directo con credentials), pero se
 * deja corregido por si se quiere reutilizar.
 */
const apiUrl = import.meta.env.VITE_APP_API_URL;

export default function useFetch(url, method = 'GET', body = null) {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		let cancelado = false;

		const run = async () => {
			setLoading(true);
			setError(null);

			try {
				const options = {
					method,
					signal: controller.signal,
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include', // sin esto no hay sesión
				};

				if (body && method !== 'GET') {
					options.body = JSON.stringify(body);
				}

				const response = await fetch(`${apiUrl}/${url}`, options);

				if (!response.ok) {
					const text = await response.text();
					let message = `HTTP ${response.status}`;
					try {
						message = JSON.parse(text).message || message;
					} catch {
						// la respuesta no era JSON
					}
					throw new Error(message);
				}

				const text = await response.text();
				if (!cancelado) setData(text ? JSON.parse(text) : null);
			} catch (err) {
				if (err.name !== 'AbortError' && !cancelado) {
					setError(err.message);
				}
			} finally {
				if (!cancelado) setLoading(false);
			}
		};

		run();

		return () => {
			cancelado = true;
			controller.abort();
		};
	}, [url, method, body]);

	return { data, error, loading };
}