export default {
  slug: "vlookup-vs-xlookup",
  title: "VLOOKUP vs XLOOKUP: Which to Use, and Why XLOOKUP Usually Wins",
  description: "A plain-English comparison of Excel's VLOOKUP and XLOOKUP — how each works, where VLOOKUP breaks, and why XLOOKUP is the better default, with guidance for beginners and power users.",
  date: "2026-02-16",
  tag: "Excel",
  readingMinutes: 8,
  cta: { label: "Practice Excel lookups", to: "/excel" },
  body: `
Lookups are the most useful thing you'll do in Excel — pulling a value from one table into another based on a matching key. For years VLOOKUP was the tool everyone learned. Then Microsoft released XLOOKUP, which fixes almost every VLOOKUP annoyance. Here's a clear comparison so you know which to use.

## What a lookup does (for beginners)

Imagine two tables: one lists product IDs and names, another lists orders with product IDs but no names. A lookup fills in the names by matching the ID. That's it — match a key, return a related value.

## How VLOOKUP works

\`\`\`
=VLOOKUP(lookup_value, table_range, column_number, FALSE)
\`\`\`

You give it the value to find, the range to search, the **number** of the column to return, and FALSE for an exact match. For example \`=VLOOKUP(A2, Products, 2, FALSE)\` finds the ID in A2 within the Products table and returns the 2nd column.

It works, but it has real limitations.

## Where VLOOKUP breaks down

1. **It only looks right.** VLOOKUP can only return a column to the *right* of the key. If the name is to the left of the ID, VLOOKUP can't do it.
2. **Column numbers are fragile.** You hard-code "return column 2". Insert a new column and the 2 now points at the wrong data — silently. This causes countless broken spreadsheets.
3. **Default is the wrong match type.** Omit the last argument and it does an *approximate* match, which returns subtly wrong results on unsorted data.
4. **No built-in "not found" handling.** You have to wrap it in IFERROR yourself.

## How XLOOKUP works

\`\`\`
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])
\`\`\`

You point at the **column to search** and the **column to return** directly — no counting. For example \`=XLOOKUP(A2, Products[ID], Products[Name], "Not found")\`.

## Why XLOOKUP usually wins

- **Looks in any direction** — the return column can be left, right, anywhere.
- **No fragile column numbers** — you reference the actual return column, so inserting columns doesn't break it.
- **Exact match by default** — the safe behaviour is the default.
- **Built-in not-found argument** — no need to wrap in IFERROR.
- **Cleaner to read** — the formula says what it does.

## When VLOOKUP still makes sense

- You're on an **older version of Excel** (XLOOKUP needs Microsoft 365 / Excel 2021+). VLOOKUP works everywhere.
- You're **maintaining an existing sheet** already built with VLOOKUP and don't want to rewrite it.
- A colleague's environment doesn't support XLOOKUP.

## What about INDEX/MATCH?

Before XLOOKUP, power users combined INDEX and MATCH to get left-and-right lookups without fragile column numbers. It still works and is worth understanding, but XLOOKUP does the same job more simply. Learn INDEX/MATCH for reading older spreadsheets; reach for XLOOKUP for new work.

## Quick recommendation

- **New spreadsheet, modern Excel?** Use **XLOOKUP**.
- **Need it to work on any version?** Use **VLOOKUP** (with FALSE for exact match, wrapped in IFERROR).
- **Reading someone else's advanced sheet?** You'll see **INDEX/MATCH** — know how it works.

## Get comfortable with all three

Lookups are best learned by doing. Practise pulling values across tables with each method until you can reach for the right one instinctively — it's one of the highest-leverage Excel skills for any analyst.
`,
};
