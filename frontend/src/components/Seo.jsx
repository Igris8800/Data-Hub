import React from "react";

const BASE = "https://www.crazycoder.tech";

// Per-page SEO. React 19 hoists <title>/<meta>/<link> to <head> automatically.
// Usage: <Seo title="…" description="…" path="/sql" />
export default function Seo({ title, description, path = "", image = `${BASE}/og-image.png`, jsonLd }) {
  const url = `${BASE}${path}`;
  const fullTitle = title ? `${title} — Crazycoder` : "Crazycoder — Practice SQL, Python, Excel, Power BI & Statistics";
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </>
  );
}
