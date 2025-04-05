import { useState } from 'preact/hooks'
const api = import.meta.env.VITE_API_URL;
export default function Login() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		try {
			const res = await fetch(`${api}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include', // para incluir cookies de sesión
				body: JSON.stringify({ "username":username, "password":password })
			})

			const data = await res.json()

			if (res.ok) {
				alert('Login correcto')
				window.location.href = '/panel';
			} else {
				setError(data.error || 'Error de autenticación')
			}
		} catch (err) {
			setError('Error de red o del servidor')
		}

		setLoading(false)
	}

  return (
    <div className="login-form p-4">
      <h2 className="text-2xl font-semibold mb-9">Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <input 
		  className='border rounded p-4'
          type="text"
          placeholder="Usuario"
          value={username}
          onInput={(e) => setUsername(e.target.value)}
          required
        />
        <input
		  className='border rounded p-4'
          type="password"
          placeholder="Contraseña"
          value={password}
          onInput={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className='bg-blue-500 text-white px-3 py-1 rounded'>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
