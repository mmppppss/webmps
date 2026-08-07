import React, { useState } from 'react';

const api = import.meta.env.VITE_APP_API_URL;
export default function Upload() {
	const [showModal, setShowModal] = useState(false);
	const [preview, setPreview] = useState(null);
	const [status, setStatus] = useState('');
	const [file, setFile] = useState(null);

	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
	}
	const handleUpload = () => {
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);

				canvas.toBlob((blob) => {
					if (!blob) {
						setStatus('Error al convertir a WebP');
						return;
					}

					const webpUrl = URL.createObjectURL(blob);
					setPreview(webpUrl);

					const formData = new FormData();
					formData.append('imagen', blob, 'archivo.webp');

					setStatus('Subiendo...');

					fetch(`${api}/upload/img`, {
						method: 'POST',
						body: formData,
					})
						.then(res => res.json())
						.then(res => {
							setStatus('Subido con éxito');
							console.log(res);
						})
						.catch(err => {
							console.error(err);
							setStatus('Error al subir');
						});
				}, 'image/webp', 0.8);
			};
			img.src = reader.result;
		};
		reader.readAsDataURL(file);
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
					onClick={() => setShowModal(false)}
				>
					<div
						className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-center text-blue-700 text-lg font-bold mb-4">
							Subir y convertir a WebP
						</h3>

						<input
							type="file"
							accept="image/*"
							onChange={handleFileChange}
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

						<div className="flex justify-between">
							<button
								type="button"
								onClick={() => handleUpload()}
								className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
							>
								Subir
							</button>

							<button
								type="button"
								onClick={() => setShowModal(false)}
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
