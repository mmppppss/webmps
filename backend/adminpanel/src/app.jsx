import { useState, useEffect } from 'preact/hooks';
import './app.css';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import { CreateArticle } from './components/Create';

const api = import.meta.env.VITE_API_URL;

export function App() {
    const [auth, setAuth] = useState(null); 
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
                } else {
                    setAuth(false);
                }
            } catch (err) {
                console.error('Error al verificar autenticación', err);
                setAuth(false);
            }
        };

        checkAuth();
    }, []);
    if (auth === null) {
        return <p className="text-center p-4">Verificando autenticación...</p>;
    }
	function generate(){
		if(!auth){
			return <Login />
		}else{
			return <Dashboard />
		}
	}
    return (
        <>
			{generate()}
        </>
    );
}

