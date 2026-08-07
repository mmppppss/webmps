import { useState, useEffect } from 'react';


const useFetch = (url, method = 'GET', params = null) => {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [connected, setConnected] = useState(true);
	const apiUrl = import.meta.env.VITE_APP_API_URL;
	const shortUrl = url;
	url = apiUrl + "/" + url;
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const options = {
					method,
					headers: {
						'Content-Type': 'application/json'
					},
				};

				if (params && method !== 'GET') {
					options.body = JSON.stringify(params);
				}
				const response = await fetch(url, options);

				if (!response.ok)
					throw new Error(response.statusText);

				const json = await response.json();
				setData(json);
			} catch (e) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		};
		fetchData();

	}, [url, method, params]);

	return { data, error, loading };
}
export default useFetch;
