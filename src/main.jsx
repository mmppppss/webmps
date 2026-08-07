import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css';
import App from './components/App';
//import { HelmetProvider } from "react-helmet-async";
createRoot(document.getElementById('root')).render(
	<App />
)
