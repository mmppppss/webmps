import { useSite } from '../utils/site';

/**
 * Pie de página.
 *
 * Antes tenía un `<a href="https://mpps.qzz.io"> </a>` vacío: un enlace
 * invisible sin destino, que los buscadores leen como enlace roto. Y pedía dos
 * imágenes externas a creativecommons.org en cada carga de página.
 */
export default function Footer() {
	const site = useSite();
	const anio = new Date().getFullYear();

	const github = site.redes?.github;

	return (
		<footer className="footer">
			<span>© {anio} </span>
			{github && (
				<a href={github} rel="noopener noreferrer">InfoCamiri</a>
			)}
			<span>· contenido bajo </span>
			<a
				href="https://creativecommons.org/licenses/by/4.0/"
				rel="noopener noreferrer"
			>
				CC BY 4.0
			</a>
		</footer>
	);
}