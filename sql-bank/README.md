# SQL question bank — source of truth

Each company folder holds its seed-data generator and question JSON files. `build.py` validates every
answer against the generated database (fails on error or empty result) and writes
`frontend/src/lib/companies/<key>.js`, which `companies.js` imports. Never hand-edit the generated files.

    cd sql-bank && python amazon/build.py      # rebuild one company

Question JSON fields: id, tier (easy|medium|hard), topic, title, context, task, hint, answer, order (bool, optional).
Tiers map to the app's beginner / intermediate / advanced levels.

## Progress toward 500 (100 per company: 34 easy · 33 medium · 33 hard)
| Company | Easy | Medium | Hard | Status |
|---------|------|--------|------|--------|
| Amazon  | 34   | 33     | 33   | done — seed expanded to 30 customers, 24 products, 150 orders, order_items table added |
| Netflix | –    | –      | –    | next |
| Uber    | –    | –      | –    | |
| Google  | –    | –      | –    | |
| Meta    | –    | –      | –    | |
