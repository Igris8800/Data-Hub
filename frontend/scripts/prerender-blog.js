/* Lightweight prerenderer — runs AFTER `react-build`. No headless browser.
 * For each blog post (and /blog), it writes a static HTML file whose <head> has the
 * correct title/description/canonical/OG + Article JSON-LD, and whose <body> contains
 * the real article text inside #root. Crawlers get full HTML; the React app hydrates
 * over it for real users. If anything here throws, the main build is already done —
 * this only adds files, it cannot break the app.
 */
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const BUILD = path.join(__dirname, "..", "build");
const POSTS_DIR = path.join(__dirname, "..", "src", "blog", "posts");
const BASE = "https://www.crazycoder.tech";

function loadPost(file) {
  // Read the ESM post file and evaluate the exported object without a bundler.
  let src = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  src = src.replace(/^export default\s*/m, "module.exports = ");
  const m = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function("module", "exports", src)(m, m.exports);
  return m.exports;
}

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pageHtml(template, { title, description, canonical, bodyHtml, jsonLd }) {
  let html = template;
  // title
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  // description
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  // canonical
  if (/<link rel="canonical"[^>]*>/.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${canonical}" />\n</head>`);
  }
  // og:title / og:description / og:url
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  // JSON-LD (append before </head>)
  if (jsonLd) {
    html = html.replace("</head>", `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`);
  }
  // inject prerendered content into #root so crawlers read the text
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main class="prerendered-content" style="max-width:768px;margin:0 auto;padding:48px 24px;">${bodyHtml}</main></div>`
  );
  return html;
}

function run() {
  const template = fs.readFileSync(path.join(BUILD, "index.html"), "utf8");
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".js"));
  const posts = files.map(loadPost);

  // Individual article pages
  for (const p of posts) {
    const articleHtml = `<article><h1>${esc(p.title)}</h1>${marked.parse(p.body)}</article>`;
    const html = pageHtml(template, {
      title: `${p.title} — Crazycoder`,
      description: p.description,
      canonical: `${BASE}/blog/${p.slug}`,
      bodyHtml: articleHtml,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description: p.description,
        datePublished: p.date,
        dateModified: p.date,
        author: { "@type": "Organization", name: "Crazycoder" },
        publisher: { "@type": "Organization", name: "Crazycoder", url: BASE },
        mainEntityOfPage: `${BASE}/blog/${p.slug}`,
      },
    });
    const dir = path.join(BUILD, "blog", p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    console.log("prerendered /blog/" + p.slug);
  }

  // Blog index page
  const listHtml =
    `<h1>Crazycoder Blog — Data Analyst Guides</h1><ul>` +
    posts
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a> — ${esc(p.description)}</li>`)
      .join("") +
    `</ul>`;
  const indexHtml = pageHtml(template, {
    title: "Blog — Data Analyst Guides & Tutorials — Crazycoder",
    description: "Practical, no-fluff guides for aspiring and working data analysts — SQL, Python, Excel, Power BI and Statistics, from beginner to interview-ready.",
    canonical: `${BASE}/blog`,
    bodyHtml: listHtml,
    jsonLd: { "@context": "https://schema.org", "@type": "Blog", name: "Crazycoder Blog", url: `${BASE}/blog` },
  });
  const blogDir = path.join(BUILD, "blog");
  fs.mkdirSync(blogDir, { recursive: true });
  fs.writeFileSync(path.join(blogDir, "index.html"), indexHtml);
  console.log("prerendered /blog");

  console.log(`Prerender complete: ${posts.length} articles + index.`);
}

try {
  run();
} catch (e) {
  console.warn("Prerender skipped (non-fatal):", e.message);
  process.exit(0); // never fail the build
}
