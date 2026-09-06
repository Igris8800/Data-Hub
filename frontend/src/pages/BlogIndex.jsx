import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import Seo from "@/components/Seo";
import { ALL_POSTS } from "@/blog/posts";

const TAG_COLOR = {
  Career: "#00FF88", SQL: "#00D4FF", Python: "#FFD166",
  Excel: "#4ADE80", Statistics: "#B892FF", "Power BI": "#F58549",
};

export default function BlogIndex() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Seo
        title="Blog — Data Analyst Guides & Tutorials"
        description="Practical, no-fluff guides for aspiring and working data analysts — SQL, Python, Excel, Power BI and Statistics, from beginner to interview-ready."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Crazycoder Blog",
          "url": "https://www.crazycoder.tech/blog",
        }}
      />
      <div className="mb-10">
        <div className="uppercase text-[11px] tracking-[0.25em] text-[#00D4FF] mb-2">Crazycoder Blog</div>
        <h1 className="font-heading text-4xl tracking-tight">Guides for every level of analyst.</h1>
        <p className="text-slate-400 mt-3 max-w-xl">Clear, practical tutorials on SQL, Python, Excel, Power BI and Statistics — whether you're just starting out or preparing for interviews.</p>
      </div>

      <div className="space-y-4">
        {ALL_POSTS.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            data-testid={`blog-card-${p.slug}`}
            className="group block rounded-xl border border-white/10 bg-[#151B23] hover:border-white/25 hover:-translate-y-0.5 transition-[transform,border-color] p-5"
          >
            <div className="flex items-center gap-3 mb-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: `${TAG_COLOR[p.tag] || "#00D4FF"}18`, color: TAG_COLOR[p.tag] || "#00D4FF", border: `1px solid ${TAG_COLOR[p.tag] || "#00D4FF"}55` }}>{p.tag}</span>
              <span className="text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {p.readingMinutes} min read</span>
              <span className="text-slate-600">{new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <h2 className="font-heading text-xl tracking-tight group-hover:text-white">{p.title}</h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{p.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-[#00D4FF]">Read guide <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
