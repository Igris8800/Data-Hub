/**
 * Interactive roadmaps (roadmap.sh style). Each roadmap = ordered stages; each stage = a spine node with child topic nodes.
 * `topics` on a node = question-bank topics it maps to, so the node can deep-link to practice and auto-complete.
 * `belt` = the belt at which a learner should comfortably clear the node.
 */
const R = (title, url) => ({ title, url });

export const ROADMAPS = {
  sql: {
    key: "sql", name: "SQL", color: "#00D4FF", route: "/sql",
    intro: "From your first SELECT to window functions, cohort analysis and query design. Every node links to real problems you can solve in the browser.",
    stages: [
      { id: "s1", title: "Foundations", belt: "White", nodes: [
        { id: "what-is-sql", title: "What is SQL & relational databases", summary: "Tables, rows, columns, primary/foreign keys, and why data is split into related tables.", points: ["A table is a set of rows with a fixed set of typed columns", "Primary key uniquely identifies a row; a foreign key points at another table's primary key", "SQL is declarative: you describe the result, the engine decides how"], resources: [R("SQLBolt — Introduction", "https://sqlbolt.com/lesson/introduction"), R("Use The Index, Luke — Anatomy of an index", "https://use-the-index-luke.com/sql/anatomy")], topics: [] },
        { id: "select", title: "SELECT & column projection", summary: "Choosing columns, aliasing them, and computing expressions inline.", points: ["SELECT col1, col2 FROM table", "AS renames a column in the output", "Arithmetic and string concatenation happen per row"], resources: [R("SQLBolt — SELECT queries", "https://sqlbolt.com/lesson/select_queries_introduction")], topics: ["SELECT", "Expressions", "Aliases"] },
        { id: "distinct", title: "DISTINCT", summary: "Collapse duplicate rows in the result.", points: ["Applies to the whole selected row, not one column", "COUNT(DISTINCT col) counts unique values"], resources: [R("Mode — SQL DISTINCT", "https://mode.com/sql-tutorial/sql-distinct/")], topics: ["DISTINCT", "COUNT DISTINCT"] },
        { id: "where", title: "WHERE & comparison operators", summary: "Filter rows before anything else happens.", points: ["=, <>, <, >, <=, >=", "Text needs single quotes; numbers don't", "WHERE runs before GROUP BY and SELECT"], resources: [R("SQLBolt — Queries with constraints", "https://sqlbolt.com/lesson/select_queries_with_constraints")], topics: ["WHERE"] },
      ]},
      { id: "s2", title: "Filtering & sorting", belt: "Yellow", nodes: [
        { id: "logic", title: "AND / OR / NOT / IN / BETWEEN", summary: "Combine conditions and express ranges and lists.", points: ["AND binds tighter than OR — use parentheses", "IN (a, b, c) is a tidier OR chain", "BETWEEN is inclusive on both ends"], resources: [R("W3Schools — SQL Operators", "https://www.w3schools.com/sql/sql_operators.asp")], topics: ["AND/OR", "IN", "NOT", "BETWEEN", "WHERE AND/OR"] },
        { id: "like", title: "LIKE & pattern matching", summary: "Search text with wildcards.", points: ["% matches any run of characters, _ exactly one", "Case sensitivity depends on the engine (SQLite: LIKE is case-insensitive for ASCII)"], resources: [R("Mode — LIKE", "https://mode.com/sql-tutorial/sql-like/")], topics: ["LIKE"] },
        { id: "null", title: "NULL semantics", summary: "NULL is the absence of a value — it is not equal to anything, including itself.", points: ["Use IS NULL / IS NOT NULL, never = NULL", "COUNT(col) ignores NULLs, COUNT(*) doesn't", "COALESCE gives a fallback value"], resources: [R("Modern SQL — NULL", "https://modern-sql.com/concept/null")], topics: ["NULL", "COALESCE"] },
        { id: "order-limit", title: "ORDER BY, LIMIT, OFFSET", summary: "Sort the result and page through it.", points: ["Sort by several keys; DESC per key", "LIMIT n OFFSET m for pagination", "Without ORDER BY, row order is undefined"], resources: [R("SQLBolt — Filtering and sorting", "https://sqlbolt.com/lesson/filtering_sorting_query_results")], topics: ["ORDER BY", "LIMIT", "LIMIT OFFSET"] },
      ]},
      { id: "s3", title: "Functions", belt: "Yellow", nodes: [
        { id: "string-fn", title: "String functions", summary: "UPPER, LOWER, LENGTH, SUBSTR, INSTR, TRIM, ||", points: ["|| concatenates in SQLite/Postgres; CONCAT elsewhere", "SUBSTR(text, start, length) is 1-indexed"], resources: [R("SQLite core functions", "https://www.sqlite.org/lang_corefunc.html")], topics: ["String functions"] },
        { id: "numeric-fn", title: "Numeric functions & rounding", summary: "ROUND, ABS, integer vs decimal division.", points: ["Integer / integer is integer division in most engines — multiply by 1.0", "ROUND(x, 2) for money"], resources: [R("PostgreSQL math functions", "https://www.postgresql.org/docs/current/functions-math.html")], topics: ["Numeric functions"] },
        { id: "date-fn", title: "Date & time functions", summary: "Extract parts, add intervals, and compute differences.", points: ["strftime('%Y-%m', d) buckets by month (SQLite)", "julianday(a) - julianday(b) gives days between", "Store dates as ISO text or native date types, never free text"], resources: [R("SQLite date functions", "https://www.sqlite.org/lang_datefunc.html")], topics: ["Dates", "Date basics"] },
        { id: "case", title: "CASE expressions", summary: "If/else logic inside a query — bucketing, flags, conditional aggregation.", points: ["Branches are evaluated top-down; first match wins", "SUM(CASE WHEN … THEN 1 ELSE 0 END) is a conditional count"], resources: [R("Mode — CASE", "https://mode.com/sql-tutorial/sql-case/")], topics: ["CASE", "CASE + aggregate"] },
      ]},
      { id: "s4", title: "Aggregation", belt: "Orange", nodes: [
        { id: "aggregates", title: "COUNT, SUM, AVG, MIN, MAX", summary: "Collapse many rows into one number.", points: ["Aggregates ignore NULL (except COUNT(*))", "AVG of integers may be integer in some engines"], resources: [R("SQLBolt — Queries with aggregates", "https://sqlbolt.com/lesson/select_queries_with_aggregates")], topics: ["COUNT", "SUM", "AVG", "MIN/MAX", "Aggregates combined"] },
        { id: "group-by", title: "GROUP BY", summary: "One output row per group.", points: ["Every non-aggregated column in SELECT must be in GROUP BY", "GROUP BY several columns for a multi-level breakdown"], resources: [R("Mode — GROUP BY", "https://mode.com/sql-tutorial/sql-group-by/")], topics: ["GROUP BY", "GROUP BY + SUM", "GROUP BY + AVG", "GROUP BY + MAX", "GROUP BY + ORDER BY"] },
        { id: "having", title: "HAVING vs WHERE", summary: "WHERE filters rows before grouping; HAVING filters groups after.", points: ["HAVING COUNT(*) > 5", "You can't use an aggregate in WHERE"], resources: [R("Mode — HAVING", "https://mode.com/sql-tutorial/sql-having/")], topics: ["HAVING", "WHERE vs HAVING", "Aggregate filter"] },
        { id: "query-order", title: "Logical order of evaluation", summary: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Knowing this explains most errors.", points: ["Column aliases from SELECT aren't visible in WHERE", "ORDER BY can use aliases because it runs last"], resources: [R("SQL order of execution (SQLBolt)", "https://sqlbolt.com/lesson/select_queries_order_of_execution")], topics: [] },
      ]},
      { id: "s5", title: "Joins", belt: "Orange", nodes: [
        { id: "inner-join", title: "INNER JOIN", summary: "Rows that match in both tables.", points: ["ON is the join condition; keep filters in WHERE", "Alias tables (orders o) to keep queries readable"], resources: [R("SQLBolt — Multi-table queries with JOINs", "https://sqlbolt.com/lesson/select_queries_with_joins")], topics: ["INNER JOIN", "INNER JOIN + WHERE", "JOIN + aggregate", "Three-table JOIN", "Multiple joins"] },
        { id: "outer-join", title: "LEFT / RIGHT / FULL OUTER JOIN", summary: "Keep unmatched rows from one or both sides.", points: ["LEFT JOIN + WHERE right.id IS NULL finds rows with no match (anti-join)", "Putting a right-table filter in WHERE silently turns a LEFT JOIN into an INNER JOIN — put it in ON"], resources: [R("Visual JOIN explainer", "https://joins.spathon.com/")], topics: ["LEFT JOIN"] },
        { id: "self-join", title: "Self joins", summary: "Join a table to itself — hierarchies, pairs, comparisons between rows.", points: ["Employees ↔ managers", "Use a.id < b.id to avoid duplicate pairs"], resources: [R("Mode — Self joins", "https://mode.com/sql-tutorial/sql-self-join/")], topics: ["Self join"] },
        { id: "set-ops", title: "UNION, INTERSECT, EXCEPT", summary: "Stack results vertically or compare sets.", points: ["UNION removes duplicates; UNION ALL keeps them (faster)", "Column count and types must line up"], resources: [R("Mode — UNION", "https://mode.com/sql-tutorial/sql-union/")], topics: ["UNION", "Set ops"] },
        { id: "fanout", title: "Join fan-out & double counting", summary: "The most common analytics bug: joining one-to-many then aggregating inflates totals.", points: ["Aggregate each side first (CTE), then join", "Check COUNT(*) before and after a join"], resources: [R("The fan-out problem", "https://www.getdbt.com/blog/write-better-sql-a-defense-of-group-by-1")], topics: ["Query reasoning", "Ratio"] },
      ]},
      { id: "s6", title: "Subqueries & CTEs", belt: "Green", nodes: [
        { id: "subquery", title: "Subqueries (scalar, IN, correlated)", summary: "A query inside a query.", points: ["Scalar subquery returns one value: WHERE price > (SELECT AVG(price) …)", "Correlated subqueries reference the outer row and run per row"], resources: [R("Mode — Subqueries", "https://mode.com/sql-tutorial/sql-sub-queries/")], topics: ["Subquery", "Subquery in FROM", "Second highest"] },
        { id: "exists", title: "EXISTS / NOT EXISTS", summary: "Test whether related rows exist — usually the cleanest anti-join.", points: ["NOT EXISTS is NULL-safe; NOT IN is not"], resources: [R("Use The Index, Luke — EXISTS", "https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/exists")], topics: ["EXISTS", "NOT EXISTS", "Data quality", "Anti-pattern fix"] },
        { id: "cte", title: "Common Table Expressions (WITH)", summary: "Name intermediate results so complex queries read top-to-bottom.", points: ["Several CTEs separated by commas", "A CTE can reference an earlier one"], resources: [R("Modern SQL — WITH", "https://modern-sql.com/feature/with")], topics: ["CTE", "Data validation", "Relational division"] },
        { id: "recursive", title: "Recursive CTEs", summary: "Generate sequences, walk hierarchies, fill date gaps.", points: ["WITH RECURSIVE t AS (anchor UNION ALL recursive step)", "Always include a termination condition"], resources: [R("SQLite — Recursive queries", "https://www.sqlite.org/lang_with.html")], topics: ["Recursive CTE"] },
      ]},
      { id: "s7", title: "Window functions", belt: "Blue", nodes: [
        { id: "win-basics", title: "OVER, PARTITION BY, ORDER BY", summary: "Compute per-row values that look at other rows without collapsing them.", points: ["OVER () = whole result; PARTITION BY = per group", "Window functions run after WHERE/GROUP BY — wrap in a subquery to filter on them"], resources: [R("Window functions explained", "https://www.windowfunctions.com/")], topics: ["Window: share", "Window: cumulative distinct"] },
        { id: "ranking", title: "ROW_NUMBER, RANK, DENSE_RANK, NTILE", summary: "Top-N per group, de-duplication, quartiles.", points: ["RANK skips after ties, DENSE_RANK doesn't", "ROW_NUMBER() … = 1 picks the latest row per group"], resources: [R("LearnSQL — Ranking functions", "https://learnsql.com/blog/ranking-functions-sql/")], topics: ["Window: RANK", "Window: ROW_NUMBER", "Window: DENSE_RANK", "Window: NTILE", "Top-N per group", "Percentile"] },
        { id: "offsets", title: "LAG, LEAD, FIRST_VALUE, LAST_VALUE", summary: "Compare a row to its neighbours: month-over-month change, gaps between events.", points: ["LAG(col, 1) = previous row in the window order", "Beware LAST_VALUE's default frame"], resources: [R("LAG and LEAD", "https://learnsql.com/blog/lead-and-lag-functions-in-sql/")], topics: ["Window: LAG", "Window: FIRST_VALUE"] },
        { id: "frames", title: "Running totals & moving averages", summary: "ROWS BETWEEN n PRECEDING AND CURRENT ROW.", points: ["SUM(x) OVER (ORDER BY d) = running total", "ROWS vs RANGE differ with ties"], resources: [R("Window frames", "https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS")], topics: ["Window: running total", "Window: moving average", "Median", "Pareto"] },
      ]},
      { id: "s8", title: "Analytics patterns", belt: "Purple", nodes: [
        { id: "cohort", title: "Cohort & retention analysis", summary: "Group users by first-activity period and track them over time.", points: ["First-order month per customer → join back", "Retained = active in month m and m-1"], resources: [R("Cohort analysis in SQL", "https://mode.com/blog/cohort-analysis-helps-look-ahead/")], topics: ["Cohort", "Churn"] },
        { id: "rfm", title: "RFM & customer segmentation", summary: "Recency, frequency, monetary value — the classic CRM score.", points: ["Compute all three per customer in one GROUP BY", "NTILE(4) to band each dimension"], resources: [R("RFM segmentation", "https://clevertap.com/blog/rfm-analysis/")], topics: ["RFM"] },
        { id: "gaps-islands", title: "Gaps & islands", summary: "Find streaks of consecutive days / values.", points: ["date - ROW_NUMBER() is constant within a streak"], resources: [R("Gaps and islands", "https://www.red-gate.com/simple-talk/databases/sql-server/t-sql-programming-sql-server/gaps-islands-sql-server-data/")], topics: ["Gaps & islands"] },
        { id: "pivot", title: "Pivoting & conditional aggregation", summary: "Turn rows into columns with CASE inside SUM/COUNT.", points: ["One CASE per output column", "Great for status-by-country style reports"], resources: [R("Pivot with CASE", "https://mode.com/sql-tutorial/sql-pivot-table/")], topics: ["Pivot"] },
        { id: "basket", title: "Market-basket & co-occurrence", summary: "Products bought together, via a self-join on order id.", points: ["a.product_id < b.product_id avoids mirrored pairs"], resources: [R("Market basket analysis in SQL", "https://www.sqlservercentral.com/articles/market-basket-analysis-with-sql")], topics: ["Basket analysis", "Rating trend", "Stock planning", "Salary analytics"] },
      ]},
      { id: "s9", title: "Beyond queries", belt: "Brown", nodes: [
        { id: "indexes", title: "Indexes & query performance", summary: "Why some queries are slow and how EXPLAIN helps.", points: ["Index the columns you filter and join on", "Functions on an indexed column defeat the index"], resources: [R("Use The Index, Luke", "https://use-the-index-luke.com/")], topics: [] },
        { id: "modelling", title: "Data modelling & normalisation", summary: "Star schemas, fact/dimension tables, 3NF.", points: ["Facts = events with measures; dimensions = descriptive lookups", "Denormalise for reporting, normalise for transactions"], resources: [R("Kimball dimensional modelling", "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/")], topics: [] },
        { id: "dml", title: "INSERT / UPDATE / DELETE & transactions", summary: "Changing data safely.", points: ["Always UPDATE/DELETE with a WHERE", "BEGIN … COMMIT / ROLLBACK"], resources: [R("PostgreSQL transactions tutorial", "https://www.postgresql.org/docs/current/tutorial-transactions.html")], topics: [] },
      ]},
    ],
  },

  excel: {
    key: "excel", name: "Excel", color: "#00FF88", route: "/excel",
    intro: "Formulas first, then lookups, conditional maths, dates, text, and modern dynamic arrays — the toolkit analysts actually use daily.",
    stages: [
      { id: "e1", title: "Sheet basics", belt: "White", nodes: [
        { id: "refs", title: "Cell references: relative vs absolute", summary: "A1 moves when copied; $A$1 doesn't; $A1 / A$1 lock one axis.", points: ["Press F4 to cycle reference types", "Ranges like B2:B41 are the input to most functions"], resources: [R("Microsoft — Switch between reference types", "https://support.microsoft.com/en-us/office/switch-between-relative-absolute-and-mixed-references-dfec08cd-ae65-4f56-839e-5f0d8b0c8b8e")], topics: ["Arithmetic", "Percent"] },
        { id: "basic-agg", title: "SUM, AVERAGE, COUNT, MIN, MAX", summary: "The five functions behind most reports.", points: ["COUNT counts numbers, COUNTA counts anything non-blank", "ROUND for presentation, not for storage"], resources: [R("ExcelJet — SUM", "https://exceljet.net/functions/sum-function")], topics: ["SUM", "AVERAGE", "COUNT", "COUNTA", "MAX", "MIN", "MAX/MIN", "ROUND", "COUNTBLANK", "MOD"] },
      ]},
      { id: "e2", title: "Logic", belt: "Yellow", nodes: [
        { id: "if", title: "IF, nested IF, IFS", summary: "Branching logic in a cell.", points: ["IFS reads better than deeply nested IF", "TRUE as the last IFS condition = else"], resources: [R("ExcelJet — IF", "https://exceljet.net/functions/if-function")], topics: ["IF", "Nested IF", "IFS"] },
        { id: "and-or", title: "AND, OR, NOT", summary: "Combine tests.", points: ["AND(a, b) returns TRUE only if both hold"], resources: [R("ExcelJet — AND", "https://exceljet.net/functions/and-function")], topics: ["Logic"] },
        { id: "iferror", title: "IFERROR & error types", summary: "#N/A, #VALUE!, #DIV/0! and how to handle them.", points: ["Wrap lookups in IFERROR to show a friendly fallback", "Don't hide real errors in calculations"], resources: [R("ExcelJet — IFERROR", "https://exceljet.net/functions/iferror-function")], topics: ["IFERROR"] },
      ]},
      { id: "e3", title: "Conditional maths", belt: "Orange", nodes: [
        { id: "countif", title: "COUNTIF / COUNTIFS", summary: "Count rows matching one or more conditions.", points: ['Criteria are text: ">8", "<>North", "N*"', "COUNTIFS pairs range/criteria"], resources: [R("ExcelJet — COUNTIFS", "https://exceljet.net/functions/countifs-function")], topics: ["COUNTIF", "COUNTIFS", "COUNTBLANK", "COUNTA"] },
        { id: "sumif", title: "SUMIF / SUMIFS / AVERAGEIFS / MAXIFS", summary: "Aggregate only the rows that match.", points: ["SUMIFS puts the sum range first, SUMIF puts it last", "Dates in criteria: \">=\"&DATE(2024,1,1)"], resources: [R("ExcelJet — SUMIFS", "https://exceljet.net/functions/sumifs-function")], topics: ["SUMIF", "SUMIFS", "AVERAGEIF", "AVERAGEIFS", "MAXIFS", "MINIFS", "Leave", "Payroll", "Attrition"] },
        { id: "sumproduct", title: "SUMPRODUCT", summary: "Multiply arrays element-wise and add up — the Swiss-army knife for weighted sums and multi-condition maths.", points: ["(range=\"x\") produces TRUE/FALSE; multiply to make 1/0", "-- coerces booleans to numbers"], resources: [R("ExcelJet — SUMPRODUCT", "https://exceljet.net/functions/sumproduct-function")], topics: ["SUMPRODUCT", "Compliance", "Compa-ratio", "Bonus", "Reorder", "Days of cover", "Turnover", "ABC", "Supplier", "Movements", "Rules", "Service level"] },
      ]},
      { id: "e4", title: "Lookups", belt: "Green", nodes: [
        { id: "vlookup", title: "VLOOKUP & HLOOKUP", summary: "Find a key in the first column and return a value from another.", points: ["Always pass FALSE for exact match", "Can't look left — use INDEX/MATCH or XLOOKUP"], resources: [R("ExcelJet — VLOOKUP", "https://exceljet.net/functions/vlookup-function")], topics: ["VLOOKUP", "Approximate match"] },
        { id: "index-match", title: "INDEX / MATCH", summary: "Flexible two-step lookup; works in any direction.", points: ["MATCH finds the position, INDEX returns the value at it", "Two MATCHes = two-way lookup"], resources: [R("ExcelJet — INDEX and MATCH", "https://exceljet.net/articles/index-and-match")], topics: ["INDEX/MATCH", "Two-way lookup", "Lookup + math", "Lookup + logic", "Nested lookup"] },
        { id: "xlookup", title: "XLOOKUP", summary: "Modern lookup with a not-found value, search direction, and multi-column returns.", points: ["XLOOKUP(key, lookup_range, return_range, if_not_found)", "Search mode -1 finds the last match"], resources: [R("ExcelJet — XLOOKUP", "https://exceljet.net/functions/xlookup-function")], topics: ["XLOOKUP"] },
      ]},
      { id: "e5", title: "Text & dates", belt: "Green", nodes: [
        { id: "text", title: "Text functions", summary: "LEFT, RIGHT, MID, FIND, LEN, SUBSTITUTE, TRIM, PROPER, TEXTJOIN.", points: ["Split names with FIND(\" \")", "TRIM + PROPER for cleaning imports"], resources: [R("ExcelJet — Text functions", "https://exceljet.net/functions/category/text")], topics: ["Text", "TEXTJOIN", "TEXTJOIN + FILTER", "Data cleaning"] },
        { id: "text-fmt", title: "TEXT() number & date formats", summary: "Turn numbers into formatted strings for labels.", points: ["TEXT(v, \"#,##0.00\")", "TEXT(date, \"mmm-yyyy\")"], resources: [R("ExcelJet — TEXT", "https://exceljet.net/functions/text-function")], topics: ["TEXT"] },
        { id: "dates", title: "Date arithmetic", summary: "Dates are serial numbers; DATE, EOMONTH, DATEDIF, NETWORKDAYS, WEEKDAY.", points: ["date + 30 = 30 days later", "EOMONTH(d, 0) = end of that month"], resources: [R("ExcelJet — Date functions", "https://exceljet.net/functions/category/date-and-time")], topics: ["Dates"] },
      ]},
      { id: "e6", title: "Dynamic arrays & stats", belt: "Blue", nodes: [
        { id: "dyn", title: "UNIQUE, FILTER, SORT, SEQUENCE", summary: "Formulas that spill multiple results.", points: ["FILTER(range, condition, if_empty)", "SORT(UNIQUE(range)) for a picklist"], resources: [R("ExcelJet — Dynamic array formulas", "https://exceljet.net/articles/dynamic-array-formulas-in-excel")], topics: ["Dynamic arrays", "FILTER", "SORT", "SORTBY"] },
        { id: "stats", title: "Statistics functions", summary: "MEDIAN, STDEV, PERCENTILE, RANK, LARGE, CORREL.", points: ["STDEV.S for samples, STDEV.P for populations", "MEDIAN(FILTER(...)) = MEDIANIF"], resources: [R("ExcelJet — Statistical functions", "https://exceljet.net/functions/category/statistical")], topics: ["Statistics", "Ranking", "LARGE/SMALL", "Conditional stats", "Percentiles", "Correlation", "Ratios", "Trend", "Marginal", "Mix", "Funnel", "Targets", "Campaigns", "Scenario", "Budget", "Variance", "Forecast", "FX", "Run rate", "Inflation", "Capex", "Pivot", "Ratio"] },
        { id: "analysis", title: "Analysis patterns", summary: "Revenue by category via lookup arrays, profit, attainment, audits.", points: ["XLOOKUP accepts an array of keys inside SUMPRODUCT", "ISNA(MATCH(...)) finds rows missing from a master list"], resources: [R("ExcelJet — Formula examples", "https://exceljet.net/formulas")], topics: ["Revenue by category", "Profit", "Rep scorecard", "Attainment", "Best product", "Audit"] },
      ]},
      { id: "e7", title: "Beyond formulas", belt: "Purple", nodes: [
        { id: "pivots", title: "PivotTables & PivotCharts", summary: "Drag-and-drop aggregation.", points: ["Rows / Columns / Values / Filters", "Group dates by month or quarter"], resources: [R("Microsoft — Create a PivotTable", "https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576")], topics: [] },
        { id: "power-query", title: "Power Query", summary: "Repeatable data cleaning and merging.", points: ["Steps are recorded and replayable", "Merge = join, Append = union"], resources: [R("Microsoft — Power Query", "https://learn.microsoft.com/en-us/power-query/")], topics: [] },
        { id: "charts", title: "Charts & conditional formatting", summary: "Make the numbers readable.", points: ["One message per chart", "Data bars and colour scales for quick scanning"], resources: [R("Storytelling with Data", "https://www.storytellingwithdata.com/chart-guide")], topics: [] },
      ]},
    ],
  },

  python: {
    key: "python", name: "Python", color: "#FFD166", route: "/python",
    intro: "Python for data work: the language basics, then pandas, cleaning, and analysis.",
    stages: [
      { id: "p1", title: "Language basics", belt: "White", nodes: [
        { id: "syntax", title: "Variables, types, control flow", summary: "int/float/str/bool, if/for/while, functions.", points: ["Indentation is syntax", "f-strings for formatting"], resources: [R("Python tutorial", "https://docs.python.org/3/tutorial/")], topics: ["Basics", "Strings", "Functions", "Control flow", "Python: functions", "Python: error handling", "Python: classes", "Python: generators", "Python: recursion", "Python: dates", "Python: regex", "Python: json"] },
        { id: "collections", title: "Lists, dicts, sets, comprehensions", summary: "The core data structures.", points: ["[x*2 for x in xs if x > 0]", "dict.get(key, default)"], resources: [R("Real Python — Comprehensions", "https://realpython.com/list-comprehension-python/")], topics: ["Lists", "Dicts", "Python: dicts", "Python: comprehension", "Python: sorting", "Python: itertools", "Python: algorithms", "Python: statistics"] },
      ]},
      { id: "p2", title: "NumPy & pandas", belt: "Yellow", nodes: [
        { id: "numpy", title: "NumPy arrays", summary: "Vectorised maths.", points: ["Broadcasting", "axis=0 vs axis=1"], resources: [R("NumPy quickstart", "https://numpy.org/doc/stable/user/quickstart.html")], topics: ["numpy"] },
        { id: "pandas-io", title: "DataFrames: load, inspect, select", summary: "read_csv, head, info, loc/iloc, boolean masks.", points: ["df[df.col > 5]", ".loc uses labels, .iloc uses positions"], resources: [R("pandas — 10 minutes", "https://pandas.pydata.org/docs/user_guide/10min.html")], topics: ["pandas: inspect", "pandas: select", "pandas: filter", "pandas: sort", "pandas: new column", "pandas: value_counts", "pandas: export", "pandas: text", "pandas: departments", "pandas: accounts", "pandas: merchants", "pandas: subscriptions", "pandas: budgets", "pandas: leave", "pandas: first"] },
        { id: "groupby", title: "groupby, agg, merge, pivot_table", summary: "The SQL of pandas.", points: ["groupby('col').agg(total=('amt','sum'))", "merge(how='left')"], resources: [R("pandas — Group by", "https://pandas.pydata.org/docs/user_guide/groupby.html")], topics: ["pandas: aggregate", "pandas: groupby", "pandas: groupby apply", "pandas: merge", "pandas: pivot", "pandas: crosstab", "pandas: reshape", "pandas: rank", "pandas: window", "pandas: transform", "pandas: cumulative", "pandas: resample", "pandas: share", "pandas: cohort", "pandas: retention", "pandas: RFM", "pandas: Pareto", "pandas: basket", "pandas: reviews", "pandas: performance", "pandas: correlation", "pandas: attrition", "pandas: churn", "pandas: recurring", "pandas: promotions", "pandas: gender gap", "pandas: org", "pandas: engagement", "pandas: completion", "pandas: savings"] },
      ]},
      { id: "p3", title: "Cleaning & analysis", belt: "Orange", nodes: [
        { id: "cleaning", title: "Missing values, types, strings, dates", summary: "fillna, astype, .str, to_datetime.", points: ["Never silently drop rows — count them first"], resources: [R("pandas — Working with text", "https://pandas.pydata.org/docs/user_guide/text.html")], topics: ["pandas: missing", "pandas: strings", "pandas: dates", "pandas: apply", "pandas: audit", "pandas: fillna", "pandas: anomaly", "pandas: gaps"] },
        { id: "viz", title: "Visualisation", summary: "matplotlib / seaborn basics.", points: ["One chart, one message"], resources: [R("seaborn tutorial", "https://seaborn.pydata.org/tutorial.html")], topics: [] },
      ]},
    ],
  },

  powerbi: {
    key: "powerbi", name: "Power BI", color: "#F58549", route: "/powerbi",
    intro: "From loading data to a star schema, DAX measures, and dashboards people actually use.",
    stages: [
      { id: "b1", title: "Get data & model", belt: "White", nodes: [
        { id: "pq", title: "Power Query transforms", summary: "Shape data before it lands in the model.", points: ["Unpivot wide tables", "Set data types early"], resources: [R("Microsoft Learn — Power BI", "https://learn.microsoft.com/en-us/training/powerplatform/power-bi")], topics: [] },
        { id: "star", title: "Star schema & relationships", summary: "Fact tables, dimension tables, one-to-many.", points: ["Avoid bi-directional filters unless you must", "A date table is non-negotiable"], resources: [R("SQLBI — Star schema", "https://www.sqlbi.com/articles/power-bi-star-schema-or-single-table/")], topics: [] },
      ]},
      { id: "b2", title: "DAX", belt: "Yellow", nodes: [
        { id: "measures", title: "Measures vs calculated columns", summary: "Measures evaluate in filter context; columns are stored per row.", points: ["Prefer measures", "SUM, AVERAGE, DISTINCTCOUNT"], resources: [R("DAX Guide", "https://dax.guide/")], topics: [] },
        { id: "calculate", title: "CALCULATE & filter context", summary: "The most important DAX function.", points: ["CALCULATE([Sales], Region = \"North\")", "ALL / ALLSELECTED to remove filters"], resources: [R("SQLBI — CALCULATE", "https://www.sqlbi.com/articles/introducing-calculate-in-dax/")], topics: [] },
        { id: "time-intel", title: "Time intelligence", summary: "YTD, MTD, same period last year.", points: ["TOTALYTD, SAMEPERIODLASTYEAR, DATEADD"], resources: [R("SQLBI — Time intelligence", "https://www.sqlbi.com/articles/time-intelligence-in-power-bi-desktop/")], topics: [] },
      ]},
      { id: "b3", title: "Reports", belt: "Orange", nodes: [
        { id: "visuals", title: "Visuals & interactions", summary: "Choosing charts, slicers, drill-through.", points: ["Bookmarks for guided stories"], resources: [R("Microsoft — Visualization types", "https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-types-for-reports-and-q-and-a")], topics: [] },
        { id: "publish", title: "Publish, refresh, RLS", summary: "Service workspaces, scheduled refresh, row-level security.", points: ["Test RLS with 'View as'"], resources: [R("Microsoft — Row-level security", "https://learn.microsoft.com/en-us/power-bi/enterprise/service-admin-rls")], topics: [] },
      ]},
    ],
  },

  stats: {
    key: "stats", name: "Statistics", color: "#B892FF", route: "/stats",
    intro: "The statistics an analyst needs to reason honestly about data.",
    stages: [
      { id: "t1", title: "Describing data", belt: "White", nodes: [
        { id: "central", title: "Mean, median, mode, spread", summary: "Where the centre is and how wide the data is.", points: ["Median resists outliers", "Std dev vs IQR"], resources: [R("Khan Academy — Statistics", "https://www.khanacademy.org/math/statistics-probability")], topics: ["Descriptive: mean", "Descriptive: median", "Descriptive: mode", "Descriptive: range", "Descriptive: variance", "Descriptive: std", "Descriptive: quantiles", "Descriptive: IQR", "Descriptive: SEM", "Descriptive: cv", "Descriptive: skew", "Descriptive: kurtosis", "Descriptive: describe", "Descriptive: sum", "Group stats", "Percentiles", "Z-score", "Trimmed mean", "Geometric mean", "Rank", "Outliers: IQR rule", "Covariance"] },
        { id: "dist", title: "Distributions", summary: "Normal, binomial, Poisson, and why the normal shows up everywhere.", points: ["68-95-99.7 rule", "Central limit theorem"], resources: [R("Seeing Theory", "https://seeing-theory.brown.edu/")], topics: ["Distributions", "Distributions: fit", "Distributions: percentile", "Distributions: exponential", "Probability", "CLT", "Simulation", "Normality"] },
      ]},
      { id: "t2", title: "Inference", belt: "Yellow", nodes: [
        { id: "sampling", title: "Sampling & confidence intervals", summary: "What a sample can tell you about a population.", points: ["Standard error shrinks with √n"], resources: [R("StatQuest — Confidence intervals", "https://www.youtube.com/watch?v=TqOeMYtOc1w")], topics: ["CI: mean", "CI: width", "CI: 99%", "CI: proportion", "Confidence: z vs t", "Confidence: bootstrap median", "Bootstrap", "Simulation: CI coverage"] },
        { id: "tests", title: "Hypothesis tests & p-values", summary: "t-tests, chi-square, and what a p-value is not.", points: ["p is P(data | H0), not P(H0 | data)", "Effect size matters more than significance"], resources: [R("StatQuest — p-values", "https://www.youtube.com/watch?v=vemZtEM63GY")], topics: ["t-test: independent", "t-test: Welch", "t-test: one-sample", "t-test: paired", "t-test: significance", "Z-test", "ANOVA", "Chi-square", "Chi-square: GOF", "Non-parametric", "Permutation test", "Effect size", "Effect size: r", "Power", "Simulation: power", "Bayes", "Distribution comparison"] },
        { id: "ab", title: "A/B testing", summary: "Designing and reading experiments.", points: ["Decide sample size before you start", "Watch for sample ratio mismatch"], resources: [R("Evan Miller — Sample size calculator", "https://www.evanmiller.org/ab-testing/sample-size.html")], topics: ["Proportions", "Two-proportion z-test", "Bootstrap: difference"] },
      ]},
      { id: "t3", title: "Relationships", belt: "Orange", nodes: [
        { id: "corr", title: "Correlation & regression", summary: "Linear relationships and their limits.", points: ["Correlation ≠ causation", "Check residuals"], resources: [R("StatQuest — Linear regression", "https://www.youtube.com/watch?v=nk2CQITm_eo")], topics: ["Correlation", "Correlation: Pearson", "Correlation: Spearman", "Correlation: p-value", "Correlation matrix", "Regression", "Regression: slope", "Regression: intercept", "Regression: R2", "Regression: predict", "Regression: residual", "Regression: manual", "Regression: standardised", "Regression: multiple", "Regression: F-test", "Regression: leverage", "Regression: prediction interval", "Regression: predict CI", "Paired"] },
        { id: "bias", title: "Bias, confounding, Simpson's paradox", summary: "How honest analysis goes wrong.", points: ["Segment before you conclude"], resources: [R("Simpson's paradox explained", "https://plato.stanford.edu/entries/paradox-simpson/")], topics: [] },
      ]},
    ],
  },
};
