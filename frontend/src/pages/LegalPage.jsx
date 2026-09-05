import React from "react";
import { useParams, Link } from "react-router-dom";

const BIZ = {
  name: "Data Hub",
  legalName: "Akash Laguri (sole proprietor)",
  email: "support@crazycoder.tech",
  country: "India",
  effective: "February 2026",
};

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="font-heading text-xl tracking-tight mb-3 text-white">{title}</h2>
    <div className="space-y-3 text-sm text-slate-300 leading-relaxed">{children}</div>
  </section>
);

function Terms() {
  return (
    <>
      <Section title="1. Who we are">
        <p>{BIZ.name} (“we”, “us”) operates an online platform that provides hands-on practice questions and learning tools for data-analysis skills (SQL, Excel, Python, Power BI and Statistics). These Terms govern your use of the website and services.</p>
      </Section>
      <Section title="2. Accounts">
        <p>You must provide accurate information when creating an account and are responsible for activity under your account. You must be at least 16 years old, or have consent from a parent or guardian, to use the service.</p>
      </Section>
      <Section title="3. Subscriptions & access">
        <p>Free accounts can access a sample set of questions per module. Premium plans (Monthly, Yearly, and Lifetime) unlock all questions and features described at checkout. Monthly and Yearly plans grant access for the stated period; the Lifetime plan grants access for the lifetime of the product.</p>
        <p>Prices are shown at checkout and may change for future purchases; changes do not affect an active paid term.</p>
      </Section>
      <Section title="4. Payments">
        <p>Payments are processed by our third-party payment provider. We do not store your full card details. By purchasing, you authorise the applicable charge and agree to the provider’s terms in addition to ours.</p>
      </Section>
      <Section title="5. Acceptable use">
        <p>You may not scrape, resell, or redistribute question content; share your account to circumvent paid access; attempt to break, overload, or reverse-engineer the platform; or use it for anything unlawful.</p>
      </Section>
      <Section title="6. Content & IP">
        <p>All questions, datasets, engines and site content are owned by {BIZ.name} or its licensors and are provided for your personal learning use only. Code you write while practising remains yours.</p>
      </Section>
      <Section title="7. Disclaimer & liability">
        <p>The service is provided “as is”. We do not guarantee employment outcomes or that the service will be uninterrupted or error-free. To the maximum extent permitted by law, our total liability is limited to the amount you paid in the previous 12 months.</p>
      </Section>
      <Section title="8. Changes & termination">
        <p>We may update these Terms; material changes will be posted here. We may suspend accounts that violate these Terms. You may stop using the service at any time.</p>
      </Section>
      <Section title="9. Contact">
        <p>Questions about these Terms? Email <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a>.</p>
      </Section>
    </>
  );
}

function Privacy() {
  return (
    <>
      <Section title="1. What we collect">
        <p>Account details you provide (name, email), your practice progress (questions attempted, solved, belts, streaks), and basic technical data (device/browser, IP, cookies) needed to run and secure the service. Payment is handled by our payment provider; we receive confirmation of purchase but not your full card number.</p>
      </Section>
      <Section title="2. How we use it">
        <p>To provide and personalise your learning experience, track progress and belts, process purchases, send service and (if you opt in) newsletter emails, prevent abuse, and improve the product.</p>
      </Section>
      <Section title="3. Sharing">
        <p>We share data only with service providers that help us operate — hosting, database, our payment processor, and email — under appropriate safeguards. We do not sell your personal data.</p>
      </Section>
      <Section title="4. Cookies">
        <p>We use cookies/local storage for sign-in sessions, saving your work per question, and remembering preferences such as theme. You can clear these in your browser, but some features may stop working.</p>
      </Section>
      <Section title="5. Data retention & your rights">
        <p>We keep your data while your account is active. You can request access to, correction of, or deletion of your personal data by emailing <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a>. We will respond within a reasonable time as required by law.</p>
      </Section>
      <Section title="6. Security">
        <p>We use industry-standard measures to protect your data, but no method of transmission or storage is completely secure.</p>
      </Section>
      <Section title="7. Contact">
        <p>Privacy questions: <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a>.</p>
      </Section>
    </>
  );
}

function Refund() {
  return (
    <>
      <Section title="Overview">
        <p>Because Premium is a digital product that unlocks access immediately, we offer refunds as described below. This policy is in addition to any rights the payment processor or your local law grants you.</p>
      </Section>
      <Section title="7-day money-back (Monthly & Yearly)">
        <p>If you are not satisfied, email <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a> within 7 days of your first payment for a full refund, provided the account has not been used abusively (e.g. bulk downloading of content).</p>
      </Section>
      <Section title="Lifetime plan">
        <p>The Lifetime plan is refundable within 7 days of purchase under the same conditions. After 7 days it is non-refundable given the permanent access granted.</p>
      </Section>
      <Section title="Renewals">
        <p>Where a plan renews, contact us before the renewal date to cancel. Renewal charges are generally non-refundable once processed, but reach out and we will review fairly.</p>
      </Section>
      <Section title="How to request">
        <p>Email <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a> from your account email with your order details. Approved refunds are returned to the original payment method, typically within 5–10 business days depending on the provider and bank.</p>
      </Section>
    </>
  );
}

function Contact() {
  return (
    <>
      <Section title="Get in touch">
        <p>We’re a small team and read every message. For support, billing, refunds, or business/team enquiries, email us and we’ll get back to you.</p>
        <p className="text-base"><span className="text-slate-400">Email:</span> <a className="text-[#00D4FF] font-medium" href={`mailto:${BIZ.email}`}>{BIZ.email}</a></p>
        <p className="text-slate-400 text-sm">Operator: {BIZ.legalName}, {BIZ.country}.</p>
      </Section>
      <Section title="Business & teams">
        <p>Rolling out Data Hub to a team? Use the Business tab in the upgrade dialog to request a quote, or email us directly.</p>
      </Section>
    </>
  );
}

const DOCS = {
  terms: { title: "Terms of Service", body: <Terms /> },
  privacy: { title: "Privacy Policy", body: <Privacy /> },
  refund: { title: "Refund & Cancellation Policy", body: <Refund /> },
  contact: { title: "Contact Us", body: <Contact /> },
};

export default function LegalPage() {
  const { doc } = useParams();
  const entry = DOCS[doc] || DOCS.terms;
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex flex-wrap gap-2 mb-8 text-sm">
        {Object.entries(DOCS).map(([key, d]) => (
          <Link key={key} to={`/legal/${key}`}
            className={`px-3 py-1.5 rounded-full border transition-colors ${key === (DOCS[doc] ? doc : "terms") ? "border-[#00D4FF] text-[#00D4FF] bg-[#00D4FF]/10" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
            {d.title}
          </Link>
        ))}
      </nav>
      <h1 className="font-heading text-3xl tracking-tight mb-1">{entry.title}</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: {BIZ.effective}</p>
      {entry.body}
      <div className="mt-12 pt-6 border-t border-white/10 text-sm text-slate-500">
        © {new Date().getFullYear()} {BIZ.name}. Need help? <a className="text-[#00D4FF]" href={`mailto:${BIZ.email}`}>{BIZ.email}</a>
      </div>
    </div>
  );
}
