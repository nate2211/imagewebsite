import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "ImageMaster Lab";
const SITE_URL = "https://imagemasterlab.com";

export default function Seo({
                                title,
                                description,
                                path = "/",
                                keywords = "",
                                image = "/favicon.svg",
                                imageAlt = "ImageMaster Lab browser image editor",
                                type = "website",
                                robots = "index,follow,max-image-preview:large",
                                jsonLd = null,
                            }) {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = `${SITE_URL}${path}`;
    const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

    return (
        <Helmet>
            <title>{pageTitle}</title>

            <meta name="description" content={description} />
            <meta name="robots" content={robots} />
            <meta name="application-name" content={SITE_NAME} />
            <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
            <meta name="theme-color" content="#07090f" />

            {keywords && <meta name="keywords" content={keywords} />}

            <link rel="canonical" href={canonicalUrl} />

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:alt" content={imageAlt} />
            <meta property="og:locale" content="en_US" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
            <meta name="twitter:image:alt" content={imageAlt} />

            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}