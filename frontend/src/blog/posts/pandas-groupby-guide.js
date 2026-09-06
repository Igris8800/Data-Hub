export default {
  slug: "pandas-groupby-guide",
  title: "Pandas groupby Explained: From Basics to Real Analyst Workflows",
  description: "A clear, level-by-level guide to pandas groupby — the single most useful pandas skill for analysts. Covers aggregation, transform, multiple keys, named aggregations and real patterns like cohorts and RFM.",
  date: "2026-02-14",
  tag: "Python",
  readingMinutes: 12,
  cta: { label: "Practice pandas in your browser", to: "/python" },
  body: `
If you learn one thing in pandas well, make it \`groupby\`. Almost every real analysis — revenue by region, average by category, retention by cohort — is a groupby underneath. This guide builds from the absolute basics to the patterns working analysts use daily.

## The mental model (start here)

Every groupby is three steps, often called **split-apply-combine**:

1. **Split** the rows into groups by some key (e.g. region).
2. **Apply** a function to each group (e.g. sum the sales).
3. **Combine** the results back into one table.

Once you see every problem this way, groupby stops being confusing.

## Beginner: your first groupby

To get total sales per region:

\`\`\`python
sales.groupby("region")["amount"].sum()
\`\`\`

Read it as: split by \`region\`, take the \`amount\` column, sum each group. Swap \`.sum()\` for \`.mean()\`, \`.count()\`, \`.max()\`, \`.min()\` as needed. This one line covers a huge share of everyday analysis.

To sort the result (most common follow-up):

\`\`\`python
sales.groupby("region")["amount"].sum().sort_values(ascending=False)
\`\`\`

## Intermediate: multiple keys and multiple metrics

**Group by more than one column** — sales per region *and* product:

\`\`\`python
sales.groupby(["region", "product"])["amount"].sum()
\`\`\`

**Compute several metrics at once** with named aggregations (the clean, modern way):

\`\`\`python
sales.groupby("region").agg(
    total=("amount", "sum"),
    orders=("order_id", "count"),
    avg_order=("amount", "mean"),
)
\`\`\`

This produces a tidy table with three named columns — exactly what you'd hand to a stakeholder.

## The concept that levels you up: transform

\`groupby().sum()\` collapses each group to one row. But often you want to keep every row and attach a group-level value — for example, each order alongside its region's average. That's \`transform\`:

\`\`\`python
sales["region_avg"] = sales.groupby("region")["amount"].transform("mean")
sales["vs_avg"] = sales["amount"] - sales["region_avg"]
\`\`\`

\`transform\` returns a result the same length as the original, so it aligns row-by-row. This is how you compute "above/below the group average", share of group total, and z-scores within a group.

## Advanced: real analyst patterns built on groupby

**Share of total** — what fraction each category contributes:

\`\`\`python
by_cat = sales.groupby("category")["amount"].sum()
share = (by_cat / by_cat.sum() * 100).round(1)
\`\`\`

**Top-N per group** — the best product in each region — combines groupby with sorting or ranking.

**Cohort analysis** — group customers by the month of their first purchase, then count how many stay active each following month. It's groupby on a derived "cohort" key.

**RFM segmentation** — group by customer to compute recency, frequency and monetary value, then bucket them. Again: groupby at its core.

**Time-based grouping** — group by month or week using the datetime accessor:

\`\`\`python
sales.groupby(sales["date"].dt.to_period("M"))["amount"].sum()
\`\`\`

## Common mistakes to avoid

- **Forgetting to reset the index** when you need a flat table: add \`.reset_index()\`.
- **Chained assignment warnings** — assign transform results back to a column directly, as shown above.
- **Silently dropping NaN groups** — groupby ignores NaN keys by default; pass \`dropna=False\` if you need them.
- **Using apply when agg/transform would do** — \`apply\` is flexible but slow; prefer the built-ins for speed and clarity.

## How to get fluent

groupby fluency is pure practice. Take a real dataset and answer twenty questions with it — totals, averages, per-group ranks, shares, cohorts. After a few dozen reps, the split-apply-combine pattern becomes automatic and most analysis questions feel routine.

## The bottom line

groupby is the workhorse of pandas. Master the three-step model, learn the difference between \`agg\` (collapse) and \`transform\` (keep shape), and you'll be able to answer the large majority of analytical questions with a couple of lines of code.
`,
};
