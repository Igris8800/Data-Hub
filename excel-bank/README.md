# Excel question bank — source of truth

- <key>/workbook.json    one folder per workbook (sales, hr, …), each with gen_workbook.py + questions_*.json
- questions_*.json       100 questions (34 easy / 33 medium / 33 hard). Fields: id, tier, topic, title, context, task, hint, answer
- build.mjs              evaluates every answer with frontend/src/lib/excelEngine.js (fails on any error) and writes frontend/src/lib/excelTrack.js

    cd excel-bank && node build.mjs

The engine (excelEngine.js) is our own MIT-clean implementation: ~90 functions incl. SUMIFS/COUNTIFS/AVERAGEIFS/MAXIFS,
VLOOKUP/HLOOKUP/XLOOKUP/INDEX/MATCH, IF/IFS/IFERROR, text (LEFT/MID/FIND/SUBSTITUTE/TEXTJOIN/TEXT…), dates (DATE/EOMONTH/
EDATE/DATEDIF/NETWORKDAYS/WEEKDAY, TODAY fixed at 2025-07-31), SUMPRODUCT with boolean arrays, dynamic arrays (UNIQUE/FILTER/SORT/SEQUENCE),
stats (MEDIAN/STDEV/PERCENTILE/CORREL/RANK/LARGE). Grading compares evaluated results (numbers to 1e-6), not formula text,
so any correct approach passes.

## Workbooks
| Key | Name | Tables | Questions |
|---|---|---|---|
| sales | Sales Ledger | Orders, Products, Reps | 100 |
| hr | HR & Payroll | Employees, Leave, Grades, Holidays | 100 — tenure, bands/compa-ratio, leave balances, attrition, NETWORKDAYS/WORKDAY with holidays |
| inventory | Inventory & Supply | | next |
| marketing | Marketing Campaigns | | |
| finance | Budget vs Actuals | | |
