import React from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import Seo from "@/components/Seo";
import { getPost, ALL_POSTS } from "@/blog/posts";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Seo title="Article not found" description="This article could not be found." path={`/blog/${slug || ""}`} />
        <h1 className="font-heading text-2xl mb-3">Article not found</h1>
        <Link to="/blog" className="text-[#00D4FF] inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to the blog</Link>
      </div>
    );
  }

  const html = marked.parse(post.body, { breaks: false });
  const related = ALL_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.description,
          "datePublished": post.date,
          "dateModified": post.date,
          "author": { "@type": "Organization", "name": "Crazycoder" },
          "publisher": { "@type": "Organization", "name": "Crazycoder", "url": "https://www.crazycoder.tech" },
          "mainEntityOfPage": `https://www.crazycoder.tech/blog/${post.slug}`,
        }}
      />

      <Link to="/blog" className="text-sm text-slate-400 hover:text-[#00D4FF] inline-flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" /> All guides</Link>

      <div className="flex items-center gap-3 mb-3 text-[12px] text-slate-500">
        <span className="text-[#00D4FF] font-semibold uppercase tracking-wider">{post.tag}</span>
        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readingMinutes} min read</span>
        <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight leading-tight mb-6">{post.title}</h1>

      <article className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />

      {post.cta && (
        <div className="mt-10 rounded-xl border border-[#00FF88]/40 bg-[#00FF88]/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-heading text-lg">Ready to practise?</div>
            <p className="text-sm text-slate-400 mt-0.5">Reading is step one — fluency comes from doing. Try it hands-on, free.</p>
          </div>
          <Link to={post.cta.to} className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#00FF88] text-[#0D1117] font-semibold px-5 py-2.5 hover:bg-[#33FFA1] transition-colors">
            {post.cta.label} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-heading text-lg tracking-tight mb-4">More guides</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="block rounded-lg border border-white/10 bg-[#151B23] hover:border-white/25 p-4 transition-colors">
                <div className="text-[10px] uppercase tracking-wider text-[#00D4FF] mb-1">{p.tag}</div>
                <div className="text-sm font-medium leading-snug">{p.title}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
