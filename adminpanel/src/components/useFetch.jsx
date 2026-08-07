import { useState, useEffect } from 'react';


const useFetch = (url, method = 'GET', params = null) => {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [connected, setConnected] = useState(true);
	const apiUrl = import.meta.env.VITE_APP_API_URL;
	const shortUrl = url;
	url = apiUrl +"/"+ url;
	const ping = async () => {
		const response = await fetch(apiUrl);
		setConnected(response.ok);
	}
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response = await fetch(url, {
					method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: params ? JSON.stringify(params) : null
				});

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

		const loadData = async () => {
			setLoading(true);
			try{
				setData(JSON.parse(response));
			} catch(e){
				setError(e.message);
			}finally{
				setLoading(false);
			}
		};

		const solve = async () => {
			await ping();
			if (connected)
				fetchData()
			else
				loadData();
		}
		solve();

	}, [url, method, params]);

	return { data, error, loading };
}
export default useFetch;
