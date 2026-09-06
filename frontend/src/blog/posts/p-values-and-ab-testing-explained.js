export default {
  slug: "p-values-and-ab-testing-explained",
  title: "P-values and A/B Testing Explained (Without the Jargon)",
  description: "A clear, honest explanation of p-values, statistical significance and A/B testing for data analysts — what they really mean, the mistakes everyone makes, and how to read a test result correctly.",
  date: "2026-02-18",
  tag: "Statistics",
  readingMinutes: 10,
  cta: { label: "Practice statistics hands-on", to: "/stats" },
  body: `
A/B testing and p-values come up constantly in analyst work and interviews, and they're widely misunderstood — even by people who use them daily. This guide explains what they actually mean in plain language, so you can run and read tests correctly.

## The question A/B testing answers

You change something — a button colour, a headline, a checkout flow — and conversions go up. But is the increase **real**, or just random luck? A/B testing is how you tell the difference between a genuine effect and normal noise.

You split users into two groups: **control** (sees the old version) and **treatment** (sees the new one). Then you compare their conversion rates and ask: is this difference bigger than we'd expect from chance alone?

## What a p-value actually is (read this twice)

The p-value is the most misunderstood number in statistics. Here is the correct definition:

> **The p-value is the probability of seeing a result at least this extreme, *if there were actually no real difference*.**

So a small p-value means: "if nothing were really going on, this result would be surprising." That gives you reason to believe something *is* going on.

By convention, if p < 0.05, we call the result **statistically significant**. That 0.05 is just a widely-used threshold, not a law of nature.

## What a p-value is NOT (the common mistakes)

This is where almost everyone goes wrong:

- **It is NOT the probability your hypothesis is true.** p = 0.03 does *not* mean "97% chance the new version is better."
- **It is NOT the probability the result was due to chance.**
- **A non-significant result does NOT prove there's no difference** — it just means you didn't find enough evidence (maybe your sample was too small).
- **Significant does NOT mean important.** With a huge sample, a trivially tiny difference can be "significant" yet meaningless for the business.

Getting these right instantly marks you as someone who actually understands statistics.

## Effect size: the number people forget

Significance tells you *whether* there's an effect; **effect size** tells you *how big* it is — and that's what the business cares about. A conversion lift from 12.0% to 12.1% might be statistically significant with millions of users, but it won't move revenue. Always report the size of the difference, not just the p-value.

## Confidence intervals: a better way to communicate

Instead of a single p-value, give a **confidence interval** — a range of plausible values for the true effect. "The lift is +2.3%, 95% CI [+0.8%, +3.8%]" tells a stakeholder both the estimate and the uncertainty. If the interval includes zero, the effect isn't distinguishable from nothing.

## Running an A/B test correctly

1. **Decide the sample size before you start.** Peeking and stopping when you see significance inflates false positives badly.
2. **Pick one primary metric** in advance. Testing twenty metrics and celebrating whichever turns significant is "p-hacking".
3. **Randomise properly** and check the groups are balanced (a "sample ratio mismatch" means something's broken).
4. **Run for full business cycles** — at least a week or two — so weekday/weekend effects wash out.
5. **Report effect size and a confidence interval**, not just "p < 0.05".

## The tests you'll actually use

- **Two proportions** (conversion rates) — a two-proportion z-test or chi-square test.
- **Comparing averages** (e.g. average order value) — a t-test.
- **More than two groups** — ANOVA.
- **When assumptions don't hold** — non-parametric tests like Mann-Whitney.

You don't need to derive these by hand; you need to know *which* applies and how to read the output.

## The honest summary

Statistics isn't about memorising formulas — it's about not fooling yourself. Understand what a p-value really means, always look at effect size, communicate uncertainty with confidence intervals, and design tests so you can trust the result. Practise running these tests on real data until reading a result feels natural.
`,
};
