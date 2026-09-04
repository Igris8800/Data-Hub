# Python question bank — source of truth

- <key>/dataset.json     DataFrames as CSV text (gen_dataset.py builds the retail set from the Amazon SQL seed)
- <key>/questions_*.json 100 per dataset (34 easy / 33 medium / 33 hard). Fields: id, tier, topic, title, context, task, hint, answer, order, starter
- grader.py              canonical serialisation of `result` (DataFrame / Series / scalar) shared with the browser
- build.py               runs every reference solution in CPython + pandas, stores the canonical expected value, writes frontend/src/lib/pythonTrack.js

    cd python-bank && python build.py

Runtime: Pyodide 0.26 (CPython 3.12 in WebAssembly) with pandas + numpy, loaded once per session (~15 MB, cached by the browser).
Grading compares the learner's `result` with the reference: DataFrames by column set + row multiset (ordered when `order` is set),
Series by (index, value) pairs (index ignored when it is positional), scalars/lists by value; floats rounded to 6 dp.

| Dataset | Frames | Questions |
|---|---|---|
| retail | customers, products, orders, order_items, reviews | 100 — Python basics, pandas selection/filter/groupby/merge/pivot, windows, cohorts, RFM, basket, audits |
| (next) | hr, streaming, finance, sensors | planned to reach 500 |

## Datasets
| Key | Name | Frames | Questions |
|---|---|---|---|
| retail | Retail (pandas) | customers, products, orders, order_items, reviews | 100 |
| hr | People Analytics (pandas) | employees, departments, reviews, leave | 100 — tenure, attrition, comp/compa-ratio, gender gap, reviews, org, leave |
