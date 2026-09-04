# Power BI bank — source of truth

Two entries (Option C): **Power BI Concepts** (quiz) + **DAX Practice** (hands-on).

## DAX Practice (hands-on)  → frontend/src/lib/daxTrack.js
- dax/gen_model.py    builds a star schema (Sales fact + Date/Product/Customer dims) → dax/model.json
- dax/questions_*.json 80 measures (28 easy / 28 medium / 24 hard)
- build.mjs           evaluates every reference measure with frontend/src/lib/daxEngine.js and stores the expected value

    cd powerbi-bank && node build.mjs

The DAX engine (frontend/src/lib/daxEngine.js) is a compact evaluator: tokenizer + Pratt parser + filter-context
model. Supports SUM/AVERAGE/MIN/MAX/COUNT/DISTINCTCOUNT/COUNTROWS, iterators (SUMX/AVERAGEX/MINX/MAXX/COUNTX),
CALCULATE with filter modifiers (ALL/ALLEXCEPT/FILTER/boolean/VALUES) and time-intelligence filters
(SAMEPERIODLASTYEAR/DATESYTD/DATEADD), RELATED, DIVIDE, IF, SWITCH(TRUE()), VAR/RETURN, RANKX (value form),
and TOTALYTD. Dates are ISO strings. It is deliberately a subset; questions stay within it.

## Power BI Concepts (quiz)  → frontend/src/lib/powerbiConcepts.js
- concepts/q1_fundamentals.json   hand-written questions
- concepts/gen_concepts.py        assembles factual MCQs from curated fact tables (DAX/M/visuals/modelling/
                                  service/report design/troubleshooting), distractors drawn from sibling facts
- concepts/build.mjs              converts _generated.json → the app's q() MCQ shape

    cd powerbi-bank/concepts && python gen_concepts.py && node build.mjs

376 generated + ~48 legacy hand-written = ~424 concept questions, merged into QUESTIONS.powerbi.

| Entry | Route | Questions |
|---|---|---|
| Power BI Concepts | /powerbi | ~424 MCQ — DAX, Power Query, modelling, visuals, RLS, performance, report design |
| DAX Practice | /powerbi/dax | 80 hands-on measures graded live against a star schema |
