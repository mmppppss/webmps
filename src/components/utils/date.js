/**
 * Formatea una fecha de la API para mostrar en el sitio.
 *
 * El servidor devuelve `created_at` como DATETIME ('2026-10-03 08:13:00') y
 * `fecha` como DATE. Antes los componentes imprimían el valor crudo, lo que
 * mostraba "2026-10-03 08:13:00" al lector.
 */
export function formatDate(valor, opciones = {}) {
	if (!valor) return '';

	const fecha = new Date(String(valor).replace(' ', 'T'));
	if (Number.isNaN(fecha.getTime())) return String(valor);

	const formato = new Intl.DateTimeFormat('es-BO', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		...opciones,
	});

	return formato.format(fecha);
}

/** Fecha corta para las listas: "3 oct 2026". */
export function formatDateShort(valor) {
	return formatDate(valor, { month: 'short' });
}