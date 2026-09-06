export default {
  slug: "sql-interview-questions",
  title: "20 SQL Interview Questions Analysts Get Asked (With How to Think About Them)",
  description: "The SQL question types that actually come up in data-analyst interviews at top companies — from basic filtering to window functions and gaps-and-islands — with how to approach each, for beginners through advanced.",
  date: "2026-02-12",
  tag: "SQL",
  readingMinutes: 13,
  cta: { label: "Practice real SQL questions", to: "/sql" },
  body: `
SQL is tested in almost every data-analyst interview, and it's where most candidates get filtered out — not because the questions are exotic, but because they haven't practised enough to write correct queries under pressure. This article walks through the **question types** that come up again and again, ordered from beginner to advanced, with how to think about each.

You don't need to memorise answers. You need to recognise the *pattern* a question belongs to.

## For beginners: the foundations they check first

Interviewers usually warm up with basics to see if you're comfortable.

**1. Filtering and sorting** — "Return all orders over $100, most recent first." Tests WHERE and ORDER BY. Watch for NULLs (a NULL never satisfies a normal comparison).

**2. Aggregation** — "Total revenue per region." Tests GROUP BY with SUM/COUNT/AVG. The classic mistake is putting a non-aggregated column in SELECT that isn't in GROUP BY.

**3. Counting distinct** — "How many unique customers ordered last month?" Tests COUNT(DISTINCT ...) plus date filtering.

**4. HAVING vs WHERE** — "Regions with more than 100 orders." WHERE filters rows before grouping; HAVING filters groups after. Confusing these is a common tell that someone hasn't used SQL much.

## For intermediate: joins and subqueries

This is where most analyst work actually lives.

**5. Inner vs left join** — "List all customers and their order counts, including customers with zero orders." A LEFT JOIN keeps everyone; an INNER JOIN would silently drop the zero-order customers. Interviewers love this because the wrong join gives a plausible-but-wrong answer.

**6. Join fan-out** — when you join a table with multiple matching rows, your totals inflate. Knowing to aggregate *before* joining (or use DISTINCT carefully) signals real experience.

**7. Subqueries and CTEs** — "Customers who spent above the average." You compute the average in one step, then compare. CTEs (WITH ...) make multi-step logic readable — use them.

**8. Self-joins** — "Find employees who earn more than their manager." Joining a table to itself trips up people who've only done simple queries.

**9. Anti-joins** — "Products that have never been ordered." Done with LEFT JOIN ... WHERE right.id IS NULL, or NOT EXISTS. A frequent favourite.

## For advanced: window functions (the real differentiator)

If you can use window functions fluently, you're ahead of most candidates. These come up constantly at data-heavy companies.

**10. Ranking** — "Top 3 products by sales in each category." RANK() / ROW_NUMBER() / DENSE_RANK() with PARTITION BY. Know the difference: ROW_NUMBER breaks ties arbitrarily, RANK leaves gaps, DENSE_RANK doesn't.

**11. Running totals** — "Cumulative revenue by day." SUM(...) OVER (ORDER BY day).

**12. Period-over-period** — "Compare each month's revenue to the previous month." LAG() to reach the prior row.

**13. Moving averages** — "7-day rolling average of active users." A window frame with ROWS BETWEEN.

**14. First/last value** — "Each customer's first purchase." FIRST_VALUE() or ROW_NUMBER() = 1.

## For senior roles: the tricky patterns

**15. Gaps and islands** — "Find consecutive streaks of active days." A classic hard problem solved by grouping on the difference between a row number and a date.

**16. Cohort / retention** — "Of users who joined in January, how many were still active each following month?" Combines first-activity grouping with per-period counts.

**17. Median** — SQL has no built-in median in many dialects; computing it with window functions or percentiles shows depth.

**18. Pivoting** — turning rows into columns with conditional aggregation (SUM(CASE WHEN ...)).

**19. Deduplication** — "Keep only the latest record per customer." ROW_NUMBER() partitioned and filtered to 1.

**20. Reasoning about a query** — sometimes they show you a query and ask what it returns, or why it's slow. Being able to *read* SQL, not just write it, matters.

## How to actually prepare

Reading about these patterns is not the same as being able to write them cold in an interview. The only reliable preparation is **solving many problems** until the patterns become automatic — ideally on realistic, business-shaped datasets rather than toy tables, because that's what modern interviews use.

Work through problems by pattern: do ten ranking questions in a row, then ten join questions, then ten window-function questions. Fluency comes from reps, not from re-reading explanations.

## The bottom line

Interviewers aren't looking for tricks — they're checking whether you can reliably translate a business question into correct SQL. Learn the patterns above, then practise each one until it's muscle memory.
`,
};
