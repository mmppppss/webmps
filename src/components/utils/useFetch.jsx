import { useState, useEffect, useCallback, useRef } from 'react';

const apiUrl = import.meta.env.VITE_APP_API_URL;

/**
 * Hook de fetch con cancelación, reintento y deduplicación.
 *
 * Antes:
 *   - `params` iba en el array de dependencias. Si quien lo llama le pasa un
 *     objeto literal, es una referencia nueva en cada render y la petición se
 *     repite en bucle.
 *   - no había AbortController: cambiar de ruta dejaba peticiones colgando que
 *     podían escribir en el estado del componente ya desmontado.
 *   - `connected` se declaraba y nunca se usaba.
 */
export default function useFetch(url, method = 'GET', params = null, options = {}) {
	const { retries = 1, enabled = true } = options;

	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(enabled);

	// Serializa params para compararlo por valor y no por referencia
	const paramsKey = params ? JSON.stringify(params) : '';
	const controllerRef = useRef(null);

	const doFetch = useCallback(async (signal, attempt) => {
		const options_ = {
			method,
			signal,
			headers: { 'Content-Type': 'application/json' },
		};

		if (params && method !== 'GET') {
			options_.body = JSON.stringify(params);
		}

		const response = await fetch(`${apiUrl}/${url}`, options_);

		if (!response.ok) {
			throw new Error(response.statusText || `HTTP ${response.status}`);
		}

		// 204 y similares no tienen cuerpo
		const text = await response.text();
		return text ? JSON.parse(text) : null;
	}, [url, method, paramsKey]);

	useEffect(() => {
		if (!enabled) {
			setLoading(false);
			return;
		}

		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;

		let cancelado = false;

		const run = async () => {
			setLoading(true);
			setError(null);

			for (let attempt = 0; attempt <= retries; attempt++) {
				try {
					const json = await doFetch(controller.signal, attempt);
					if (!cancelado) setData(json);
					break;
				} catch (err) {
					if (err.name === 'AbortError' || cancelado) return;

					if (attempt === retries) {
						setError(err.message);
					} else {
						// backoff corto antes de reintentar
						await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
					}
				}
			}

			if (!cancelado) setLoading(false);
		};

		run();

		return () => {
			cancelado = true;
			controller.abort();
		};
	}, [url, method, paramsKey, retries, enabled, doFetch]);

	return { data, error, loading };
}