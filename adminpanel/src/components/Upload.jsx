import { useState } from 'preact/hooks';

const api = import.meta.env.VITE_APP_API_URL;
const MAX_MB = 8;

/**
 * Sube una imagen al servidor.
 * La conversion a WebP la hace el backend (GD): hacerlo aqui con canvas
 * generaba archivos de varios MB en el navegador y dependia de que el
 * navegador del usuario lo soportara.
 */
export default function Upload({ onUploaded }) {
	const [showModal, setShowModal] = useState(false);
	const [preview, setPreview] = useState(null);
	const [status, setStatus] = useState('');
	const [error, setError] = useState(null);
	const [file, setFile] = useState(null);
	const [busy, setBusy] = useState(false);

	const close = () => {
		setShowModal(false);
		setStatus('');
		setError(null);
		setFile(null);
		if (preview) URL.revokeObjectURL(preview);
		setPreview(null);
	};

	const handleFileChange = (e) => {
		const selected = e.target.files?.[0];
		if (!selected) return;

		if (selected.size > MAX_MB * 1024 * 1024) {
			setError(`La imagen supera los ${MAX_MB} MB`);
			setFile(null);
			return;
		}

		setError(null);
		setFile(selected);
		setPreview(URL.createObjectURL(selected));
	};

	const handleUpload = async () => {
		if (!file || busy) return;

		setBusy(true);
		setError(null);
		setStatus('Subiendo...');

		const formData = new FormData();
		formData.append('imagen', file, file.name);

		try {
			const res = await fetch(`${api}/upload/img`, {
				method: 'POST',
				body: formData,
				credentials: 'include', // el endpoint exige sesión
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(data.error || 'No se pudo subir la imagen');
			}

			setStatus('Subido con éxito');
			// el nombre del archivo se devuelve al formulario para insertarlo
			if (onUploaded) onUploaded(data.filename, data.url);
		} catch (err) {
			setStatus('');
			setError(err.message || 'Error al subir');
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setShowModal(true)}
				className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
			>
				Subir imagen
			</button>

			{showModal && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={close}
				>
					<div
						className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-center text-blue-700 text-lg font-bold mb-4">
							Subir imagen
						</h3>

						<input
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleFileChange}
							disabled={busy}
							className="mb-4 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                               file:rounded file:border-0 file:text-sm file:font-semibold
                               file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>

						{preview && (
							<img
								src={preview}
								alt="Preview"
								className="max-w-[200px] mx-auto mb-4 rounded"
							/>
						)}

						{status && (
							<p className="text-green-600 text-sm mb-4 text-center">{status}</p>
						)}
						{error && (
							<p className="text-red-600 text-sm mb-4 text-center">{error}</p>
						)}

						<div className="flex justify-between">
							<button
								type="button"
								onClick={handleUpload}
								disabled={!file || busy}
								className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
								           text-white font-semibold px-4 py-2 rounded"
							>
								{busy ? 'Subiendo...' : 'Subir'}
							</button>

							<button
								type="button"
								onClick={close}
								className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}