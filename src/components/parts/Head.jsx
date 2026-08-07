import React from "react";
import { Helmet } from "react-helmet-async";

export default function Head({
    titulo,
    fecha,
    enlace,
    categoria,
    descripcion,
    author,
}) {
    const siteUrl = "https://mmppppss.rf.gd";
    const pageUrl = `${siteUrl}/${enlace || ""}`;
    const metaDescription = descripcion || "Descripción del artículo.";
    const shareImage = `${siteUrl}/default-share-image.jpg`;

    return (
        <Helmet>
            {/* Título */}
            <title>{titulo}</title>

            {/* Metadatos generales */}
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta httpEquiv="Content-Language" content="es" />
            <meta name="robots" content="index, follow" />
            <meta name="author" content={author || "Autor desconocido"} />
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={`${categoria || ""}, blog, ${titulo}`} />
            <meta name="theme-color" content="#282828" />

            {/* Fecha de publicación (opcional para SEO) */}
            {fecha && <meta name="date" content={fecha} />}

            {/* Canonical URL */}
            <link rel="canonical" href={pageUrl} />

            {/* Open Graph */}
            <meta property="og:type" content="article" />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:title" content={titulo} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={shareImage} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={titulo} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={shareImage} />
        </Helmet>
    );
}
