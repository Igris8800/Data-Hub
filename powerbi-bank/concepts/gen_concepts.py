"""Generates factual Power BI concept MCQs. Every fact here is hand-curated and correct;
the generator only assembles questions + plausible distractors from sibling facts so we get
breadth (hundreds of questions) without hand-writing each one. Output merges with the JSON concept files."""
import json, os, random
random.seed(2024)
here=os.path.dirname(os.path.abspath(__file__))

# ---- 1. DAX function purposes: (name, one-line purpose, category, tier) ----
DAX=[
 ("SUM","adds up all the numbers in a column","agg","easy"),
 ("AVERAGE","returns the arithmetic mean of a column","agg","easy"),
 ("MIN","returns the smallest value in a column","agg","easy"),
 ("MAX","returns the largest value in a column","agg","easy"),
 ("COUNT","counts the non-blank numeric values in a column","agg","easy"),
 ("COUNTA","counts the non-blank values in a column (any type)","agg","easy"),
 ("COUNTROWS","counts the rows of a table","agg","easy"),
 ("DISTINCTCOUNT","counts the distinct values in a column","agg","easy"),
 ("SUMX","iterates a table and sums an expression evaluated per row","iter","medium"),
 ("AVERAGEX","iterates a table and averages an expression per row","iter","medium"),
 ("MINX","iterates a table and returns the smallest expression value","iter","medium"),
 ("MAXX","iterates a table and returns the largest expression value","iter","medium"),
 ("COUNTX","iterates a table and counts non-blank expression results","iter","medium"),
 ("CALCULATE","evaluates an expression in a modified filter context","context","medium"),
 ("FILTER","returns a subset of a table that meets a condition","table","medium"),
 ("ALL","removes filters from a table or columns","context","medium"),
 ("ALLEXCEPT","removes filters from a table except on the given columns","context","hard"),
 ("ALLSELECTED","keeps filters coming from outside the current visual","context","hard"),
 ("REMOVEFILTERS","clears filters from the specified tables or columns","context","medium"),
 ("VALUES","returns the distinct values of a column in the current context","table","medium"),
 ("DISTINCT","returns a one-column table of distinct values","table","medium"),
 ("RELATED","fetches a column value from the one-side of a relationship","rel","medium"),
 ("RELATEDTABLE","returns the related rows from the many-side of a relationship","rel","hard"),
 ("DIVIDE","divides two numbers and safely returns blank (or a fallback) on divide-by-zero","math","easy"),
 ("IF","returns one value when a condition is true and another when false","logic","easy"),
 ("SWITCH","matches an expression against several values and returns the corresponding result","logic","medium"),
 ("RANKX","ranks the rows of a table by an expression","rank","hard"),
 ("TOPN","returns the top N rows of a table by an expression","rank","hard"),
 ("TOTALYTD","returns a year-to-date total of an expression","time","medium"),
 ("TOTALQTD","returns a quarter-to-date total of an expression","time","medium"),
 ("TOTALMTD","returns a month-to-date total of an expression","time","medium"),
 ("SAMEPERIODLASTYEAR","shifts the date context back one year","time","medium"),
 ("DATEADD","shifts the date context by a number of intervals","time","hard"),
 ("DATESYTD","returns the set of dates from the start of the year to the current date","time","hard"),
 ("PARALLELPERIOD","returns a full parallel period shifted by an interval","time","hard"),
 ("PREVIOUSMONTH","returns the dates of the previous month","time","hard"),
 ("CONCATENATE","joins two text strings into one","text","easy"),
 ("CONCATENATEX","iterates a table and joins an expression into a delimited string","text","hard"),
 ("FORMAT","converts a value to text in a specified format","text","medium"),
 ("LEFT","returns the leftmost characters of a text value","text","easy"),
 ("SEARCH","returns the position of one text string inside another (case-insensitive)","text","medium"),
 ("RELATED","returns a related value across a one-to-many relationship","rel","medium"),
 ("EARLIER","refers to an earlier row context (legacy pattern before variables)","context","hard"),
 ("SELECTEDVALUE","returns the single value of a column when only one is in context, else a default","context","medium"),
 ("HASONEVALUE","tests whether exactly one value is in the filter context for a column","context","hard"),
 ("KEEPFILTERS","adds a filter without overwriting existing filters on the same column","context","hard"),
 ("USERELATIONSHIP","activates an inactive relationship for a calculation","rel","hard"),
 ("VAR","stores an intermediate result for reuse within a measure","syntax","medium"),
 ("BLANK","returns a blank value","math","easy"),
 ("ROUND","rounds a number to a specified number of digits","math","easy"),
 ("ABS","returns the absolute value of a number","math","easy"),
]

# ---- 2. Power Query / M facts ----
PQ=[
 ("Power Query Editor","transforms and cleans source data before it loads (the ETL layer)","easy"),
 ("Merge Queries","combines two queries by matching keys, like a SQL JOIN","medium"),
 ("Append Queries","stacks the rows of two queries, like a SQL UNION","medium"),
 ("Query folding","pushes transformation steps back to the source as a native query","hard"),
 ("Unpivot Columns","turns wide columns into attribute-value rows","medium"),
 ("Pivot Column","turns unique row values into columns","medium"),
 ("Group By","aggregates rows into summary rows in Power Query","medium"),
 ("Remove Duplicates","keeps only distinct rows for the selected columns","easy"),
 ("Change Type","sets the data type of a column","easy"),
 ("Fill Down","replaces nulls with the last non-null value above","medium"),
 ("Reference","creates a new query that starts from another query's output","medium"),
 ("Duplicate","creates an independent copy of a query","easy"),
 ("Parameters","let you make queries dynamic (e.g. a file path or a date range)","medium"),
 ("Column from Examples","infers a transformation from sample outputs you type","medium"),
 ("Enter Data","lets you type a small static table by hand","easy"),
 ("Applied Steps","record each transformation so it replays on every refresh","easy"),
 ("Split Column","divides one column into several by a delimiter or width","easy"),
 ("Replace Values","substitutes one value for another in a column","easy"),
]

# ---- 3. Visuals: which visual for which job ----
VIS=[
 ("Line chart","showing a trend over continuous time","easy"),
 ("Clustered column chart","comparing a measure across categories","easy"),
 ("Card","displaying a single KPI number","easy"),
 ("KPI visual","showing a value against a target with a trend","medium"),
 ("Matrix","a cross-tab with row and column groups and drill-down","medium"),
 ("Table","a simple list of rows and columns","easy"),
 ("Slicer","letting users filter other visuals on the page","easy"),
 ("Map","plotting values by geography","easy"),
 ("Scatter chart","showing the relationship between two numeric measures","medium"),
 ("Treemap","showing part-to-whole with nested rectangles","medium"),
 ("Gauge","showing progress toward a single target on a dial","medium"),
 ("Waterfall chart","showing how an initial value is affected by sequential increases and decreases","medium"),
 ("Funnel chart","showing values through the stages of a process","medium"),
 ("Decomposition tree","interactively breaking a measure down by dimensions","hard"),
 ("Key influencers","finding which factors most affect a metric","hard"),
 ("Ribbon chart","showing rank changes across a category over time","hard"),
]

# ---- 4. Modelling facts (MCQ with fixed correct answer + distractors) ----
MODEL=[
 ("Star schema","A star schema places the ______ in the centre connected to dimension tables.",
   "fact table",["fact table","dimension table","measure","slicer"],"medium"),
 ("Fact contents","A fact table typically stores ______.",
   "foreign keys and numeric measures",["foreign keys and numeric measures","only descriptive text","only dates","report visuals"],"medium"),
 ("Dimension contents","A dimension table typically stores ______.",
   "descriptive attributes used to slice data",["descriptive attributes used to slice data","transaction amounts","measures","M code"],"medium"),
 ("Cardinality","The usual relationship between a dimension and a fact table is ______.",
   "one-to-many (dimension to fact)",["one-to-many (dimension to fact)","many-to-many","one-to-one","zero-to-one"],"medium"),
 ("Cross-filter direction","Cross-filter direction on a relationship controls ______.",
   "how filters propagate between the related tables",["how filters propagate between the related tables","the sort order","refresh timing","visual colours"],"medium"),
 ("Date table","A dedicated Date table is recommended because it ______.",
   "enables reliable time-intelligence calculations",["enables reliable time-intelligence calculations","makes refresh faster","reduces file size only","is required to publish"],"medium"),
 ("Mark as date table","'Mark as date table' is needed so that ______.",
   "time-intelligence functions work correctly against it",["time-intelligence functions work correctly against it","the table sorts alphabetically","visuals render faster","RLS applies"],"hard"),
 ("Snowflake","A snowflake schema differs from a star schema because ______.",
   "dimensions are normalised into multiple related tables",["dimensions are normalised into multiple related tables","there is no fact table","it has no relationships","it cannot use DAX"],"hard"),
 ("Inactive relationship","When two tables have multiple relationships, extra ones are ______.",
   "inactive until activated with USERELATIONSHIP",["inactive until activated with USERELATIONSHIP","deleted automatically","always bidirectional","ignored by DAX"],"hard"),
 ("Bidirectional risk","Bidirectional cross-filtering should be used sparingly because it can ______.",
   "create ambiguous filter paths and performance issues",["create ambiguous filter paths and performance issues","delete data","disable slicers","prevent publishing"],"hard"),
 ("Calculated column timing","A calculated column is computed ______.",
   "at data refresh and stored in the model",["at data refresh and stored in the model","at query time per visual","only in Power Query","never"],"medium"),
 ("Measure timing","A measure is computed ______.",
   "at query time based on the current filter context",["at query time based on the current filter context","once at import","only in Data view","in Power Query"],"medium"),
 ("When to use a measure","Prefer a measure over a calculated column when you need a value that ______.",
   "responds to the filter/slicer context of a visual",["responds to the filter/slicer context of a visual","is a fixed per-row attribute","is only text","never aggregates"],"medium"),
 ("Surrogate key","In modelling, a surrogate key is ______.",
   "a system-generated key used to join fact and dimension",["a system-generated key used to join fact and dimension","a natural business code","a measure","a visual"],"hard"),
 ("Role-playing dimension","A single Date table used for OrderDate and ShipDate is a ______.",
   "role-playing dimension",["role-playing dimension","snowflake","bridge table","measure table"],"hard"),
 ("Bridge table","A bridge (junction) table is used to model a ______ relationship.",
   "many-to-many",["many-to-many","one-to-one","one-to-many","self"],"hard"),
]

# ---- 5. Service / admin / performance facts ----
SERVICE=[
 ("RLS location","Row-level security roles are created in Power BI Desktop under ______.",
   "Modeling ▸ Manage Roles",["Modeling ▸ Manage Roles","Home ▸ Refresh","View ▸ Bookmarks","Insert ▸ Visual"],"medium"),
 ("RLS DAX","An RLS role filters a table using a ______.",
   "DAX filter expression that returns TRUE/FALSE per row",["DAX filter expression that returns TRUE/FALSE per row","Power Query step","visual filter","slicer"],"hard"),
 ("Dynamic RLS","Dynamic RLS commonly filters using ______ to match the logged-in user.",
   "USERPRINCIPALNAME()",["USERPRINCIPALNAME()","TODAY()","RAND()","BLANK()"],"hard"),
 ("DirectQuery","DirectQuery mode ______.",
   "sends live queries to the source for each visual",["sends live queries to the source for each visual","imports all data into the model","only works with Excel","ignores relationships"],"hard"),
 ("Import mode","Import mode ______.",
   "loads a compressed copy of the data into the model",["loads a compressed copy of the data into the model","queries the source live","cannot use DAX","requires Premium"],"medium"),
 ("Composite model","A composite model lets you ______.",
   "mix Import and DirectQuery tables in one model",["mix Import and DirectQuery tables in one model","only use Import","only use DirectQuery","avoid relationships"],"hard"),
 ("Incremental refresh","Incremental refresh requires ______.",
   "RangeStart and RangeEnd date parameters",["RangeStart and RangeEnd date parameters","a star schema","a slicer","Premium only"],"hard"),
 ("Aggregations","Aggregation tables improve performance by ______.",
   "serving high-level queries from pre-summarised data",["serving high-level queries from pre-summarised data","deleting detail rows","filtering visuals","refreshing faster only"],"hard"),
 ("VertiPaq","The in-memory engine that compresses and stores Import data is called ______.",
   "VertiPaq",["VertiPaq","DirectQuery","Power Query","M"],"hard"),
 ("Scheduled refresh","Scheduled refresh of an Import dataset requires ______ for on-prem sources.",
   "an on-premises data gateway",["an on-premises data gateway","a slicer","Power Query only","a bookmark"],"medium"),
 ("Gateway","The on-premises data gateway is used to ______.",
   "securely connect the Service to on-prem data sources",["securely connect the Service to on-prem data sources","design visuals","write DAX","store .pbix files"],"medium"),
 ("Sensitivity labels","Sensitivity labels in Power BI are used for ______.",
   "classifying and protecting content (e.g. Confidential)",["classifying and protecting content (e.g. Confidential)","speeding up refresh","sorting visuals","creating measures"],"medium"),
 ("Performance analyzer","Performance Analyzer in Desktop helps you ______.",
   "measure how long each visual and its DAX take",["measure how long each visual and its DAX take","publish reports","design a theme","set RLS"],"medium"),
 ("Reduce model size","A common way to shrink an Import model is to ______.",
   "remove unused columns and high-cardinality columns",["remove unused columns and high-cardinality columns","add more visuals","use more slicers","disable relationships"],"hard"),
 ("Data gateway type","For a single user's personal scheduled refresh you can use the ______ gateway.",
   "personal mode",["personal mode","enterprise-only","visual","query"],"medium"),
]

# ---- 6. Interaction / report design facts ----
REPORT=[
 ("Bookmarks","Bookmarks capture ______.",
   "the current state of a page (filters, visibility, selections)",["the current state of a page (filters, visibility, selections)","only slicer values","a copy of the data","a DAX measure"],"medium"),
 ("Drill-through","A drill-through page lets a user ______.",
   "jump to a detail page filtered by the selected item",["jump to a detail page filtered by the selected item","remove all filters","delete a page","publish the report"],"medium"),
 ("Drill down","Drill-down on a hierarchy visual lets you ______.",
   "move from a summary level to a more detailed level",["move from a summary level to a more detailed level","change the theme","export data","set RLS"],"easy"),
 ("Filter scopes","The Filters pane can apply filters at the ______ levels.",
   "visual, page and report",["visual, page and report","visual only","page only","model only"],"medium"),
 ("Sync slicers","Sync slicers let you ______.",
   "share a slicer's selection across multiple pages",["share a slicer's selection across multiple pages","refresh data","merge queries","publish"],"medium"),
 ("Edit interactions","Edit interactions controls ______.",
   "how selecting one visual filters or highlights others",["how selecting one visual filters or highlights others","the refresh schedule","the data types","RLS"],"medium"),
 ("Conditional formatting","Conditional formatting on a value can be driven by ______.",
   "rules, field values, a colour scale or icons",["rules, field values, a colour scale or icons","only rules","only icons","nothing"],"medium"),
 ("Tooltip page","A report page can be used as a ______.",
   "custom tooltip that appears on hover",["custom tooltip that appears on hover","slicer","measure","gateway"],"hard"),
 ("Themes","A report theme controls ______.",
   "the default colours and formatting of visuals",["the default colours and formatting of visuals","the data model","the refresh","RLS"],"easy"),
 ("Buttons and actions","A button's action can navigate to ______.",
   "a bookmark, page or URL",["a bookmark, page or URL","a measure","a relationship","a query step"],"medium"),
 ("Q&A visual","The Q&A visual lets users ______.",
   "ask natural-language questions to generate a visual",["ask natural-language questions to generate a visual","write M code","set RLS","schedule refresh"],"medium"),
 ("Small multiples","Small multiples split a visual into ______.",
   "a grid of smaller charts by a category",["a grid of smaller charts by a category","one big chart","a slicer","a table"],"hard"),
 ("Pie chart pitfall","Pie charts become hard to read when they have ______.",
   "many small slices",["many small slices","two slices","one slice","three slices"],"easy"),
 ("Line vs column","Use a line chart rather than columns when emphasising ______.",
   "a trend over continuous time",["a trend over continuous time","a part-to-whole split","a single KPI","a map"],"easy"),
]

_POOL=[]
def opts(correct, distractors, k=4):
    seen={correct}; ds=[]
    for d in list(distractors)+_POOL:
        if d and d not in seen: seen.add(d); ds.append(d)
        if len(ds)>=k-1: break
    o=[correct]+ds[:k-1]
    random.shuffle(o)
    return o

out=[]
_POOL[:] = ["a slicer","a measure","a relationship","the report theme","the data model","a bookmark","Power Query","a visual","the filter context","refresh timing"]
# DAX purpose questions (both directions)
purposes=[d[1] for d in DAX]
names=[d[0] for d in DAX]
for name,purpose,cat,tier in DAX:
    # forward: what does X do
    sib=[p for (n,p,c,t) in DAX if c==cat and p!=purpose] or [p for (n,p,c,t) in DAX if p!=purpose]
    out.append({"tier":tier,"topic":"DAX functions","title":f"{name}()","q":f"What does the DAX function {name}() do?","options":opts(purpose,sib+random.sample(purposes,3)),"answer":purpose,"why":f"{name} {purpose}."})
    # reverse: which function does Y (only for medium/hard to add variety)
    if tier!="easy":
        sibn=[n for (n,p,c,t) in DAX if c==cat and n!=name] or [n for (n,p,c,t) in DAX if n!=name]
        out.append({"tier":tier,"topic":"DAX functions","title":f"Which function {cat}","q":f"Which DAX function {purpose}?","options":opts(name,sibn+random.sample(names,3)),"answer":name,"why":f"{name} {purpose}."})

# Power Query
pq_purposes=[p for (n,p,t) in PQ]
for name,purpose,tier in PQ:
    out.append({"tier":tier,"topic":"Power Query","title":name,"q":f"In Power Query, '{name}' is used to…","options":opts(purpose,random.sample(pq_purposes,4)),"answer":purpose,"why":f"{name} {purpose}."})

# Visuals: which visual for job
vis_names=[v[0] for v in VIS]; vis_jobs=[v[1] for v in VIS]
for name,job,tier in VIS:
    out.append({"tier":tier,"topic":"Visuals","title":name,"q":f"Which visual is best for {job}?","options":opts(name,random.sample(vis_names,4)),"answer":name,"why":f"A {name} is designed for {job}."})
    if tier!="easy":
        out.append({"tier":tier,"topic":"Visuals","title":f"{name} use","q":f"A {name} is most appropriate for…","options":opts(job,random.sample(vis_jobs,4)),"answer":job,"why":f"A {name} is designed for {job}."})

# Fixed-answer banks
for bank,topic in [(MODEL,"Data modelling"),(SERVICE,"Service & performance"),(REPORT,"Report design")]:
    for row in bank:
        title,qtext,correct,choices,tier=row
        out.append({"tier":tier,"topic":topic,"title":title,"q":qtext.replace("______","…"),"options":opts(correct,choices),"answer":correct,"why":f"{correct}."})



# ---- 7. More DAX functions ----
DAX2=[
 ("SUMMARIZE","groups a table by columns and adds summary columns","table","hard"),
 ("ADDCOLUMNS","returns a table with new calculated columns added","table","hard"),
 ("SELECTCOLUMNS","returns a table keeping only chosen (renamed) columns","table","hard"),
 ("GROUPBY","groups a table and aggregates with CURRENTGROUP","table","hard"),
 ("CROSSJOIN","returns the Cartesian product of two tables","table","hard"),
 ("UNION","stacks two tables with matching columns","table","hard"),
 ("INTERSECT","returns rows common to two tables","table","hard"),
 ("EXCEPT","returns rows in the first table not in the second","table","hard"),
 ("NATURALINNERJOIN","joins two tables on their common columns","table","hard"),
 ("GENERATESERIES","returns a single-column table of numbers in a range","table","hard"),
 ("CALENDAR","returns a one-column date table between two dates","time","medium"),
 ("CALENDARAUTO","returns a date table spanning all dates in the model","time","medium"),
 ("ISBLANK","tests whether a value is blank","logic","easy"),
 ("ISERROR","tests whether an expression returns an error","logic","medium"),
 ("IFERROR","returns an alternative value when an expression errors","logic","medium"),
 ("COALESCE","returns the first non-blank argument","logic","medium"),
 ("AND","returns TRUE only if both conditions are true","logic","easy"),
 ("OR","returns TRUE if either condition is true","logic","easy"),
 ("NOT","reverses a boolean value","logic","easy"),
 ("TRUE","returns the logical value true","logic","easy"),
 ("CONVERT","converts a value to a specified data type","math","medium"),
 ("CEILING","rounds a number up to a multiple","math","medium"),
 ("FLOOR","rounds a number down to a multiple","math","medium"),
 ("MOD","returns the remainder of a division","math","medium"),
 ("POWER","raises a number to a power","math","medium"),
 ("SQRT","returns the square root of a number","math","easy"),
 ("TRIM","removes extra spaces from text","text","easy"),
 ("UPPER","converts text to upper case","text","easy"),
 ("LOWER","converts text to lower case","text","easy"),
 ("LEN","returns the number of characters in text","text","easy"),
 ("MID","returns characters from the middle of text","text","medium"),
 ("RIGHT","returns the rightmost characters of text","text","easy"),
 ("SUBSTITUTE","replaces occurrences of text with new text","text","medium"),
 ("REPT","repeats text a number of times","text","medium"),
 ("VALUE","converts a text number to a numeric value","text","medium"),
 ("YEAR","returns the year of a date","date","easy"),
 ("MONTH","returns the month number of a date","date","easy"),
 ("DAY","returns the day of the month of a date","date","easy"),
 ("WEEKDAY","returns the day-of-week number of a date","date","medium"),
 ("EOMONTH","returns the last day of the month, offset by months","date","medium"),
 ("TODAY","returns the current date","date","easy"),
 ("NOW","returns the current date and time","date","easy"),
 ("DATEDIFF","returns the difference between two dates in a chosen unit","date","medium"),
 ("FIRSTNONBLANK","returns the first value where an expression is non-blank","context","hard"),
 ("LOOKUPVALUE","returns a value by matching one or more search columns","rel","medium"),
 ("TREATAS","applies the values of a table as a filter on columns","context","hard"),
 ("CROSSFILTER","changes the cross-filter direction inside a calculation","rel","hard"),
 ("PERCENTILE.INC","returns the k-th percentile of values (inclusive)","agg","hard"),
 ("MEDIAN","returns the median of a column","agg","medium"),
 ("STDEV.P","returns the population standard deviation of a column","agg","hard"),
 ("VAR.P","returns the population variance of a column","agg","hard"),
 ("RANK.EQ","returns the rank of a number in a list (ties share a rank)","rank","medium"),
 ("PREVIOUSYEAR","returns the dates of the previous year","time","hard"),
 ("NEXTMONTH","returns the dates of the next month","time","hard"),
 ("STARTOFMONTH","returns the first date of the month in context","time","hard"),
 ("ENDOFYEAR","returns the last date of the year in context","time","hard"),
 ("OPENINGBALANCEMONTH","returns a measure's value at the start of the month","time","hard"),
 ("CLOSINGBALANCEYEAR","returns a measure's value at the end of the year","time","hard"),
]
_names2=[d[0] for d in DAX2]; _purp2=[d[1] for d in DAX2]
allpurp=purposes+_purp2; allnames=names+_names2
for name,purpose,cat,tier in DAX2:
    sib=[p for (n,p,c,t) in DAX2 if c==cat and p!=purpose] or [p for (n,p,c,t) in DAX2 if p!=purpose]
    out.append({"tier":tier,"topic":"DAX functions","title":name+"()","q":f"What does the DAX function {name}() do?","options":opts(purpose,sib+random.sample(allpurp,3)),"answer":purpose,"why":f"{name} {purpose}."})
    if tier!="easy":
        sibn=[n for (n,p,c,t) in DAX2 if c==cat and n!=name] or [n for (n,p,c,t) in DAX2 if n!=name]
        out.append({"tier":tier,"topic":"DAX functions","title":f"Pick {cat}","q":f"Which DAX function {purpose}?","options":opts(name,sibn+random.sample(allnames,3)),"answer":name,"why":f"{name} {purpose}."})

# ---- 8. Concept scenarios (fixed answer + distractors) ----
SCEN=[
 ("Filter vs row context","In a measure, CALCULATE can turn a filter argument into a modified ______.",
   "filter context",["filter context","row context","visual","query plan"],"hard"),
 ("Context transition","Wrapping an aggregation in CALCULATE inside an iterator triggers ______.",
   "context transition (row context becomes filter context)",["context transition (row context becomes filter context)","query folding","incremental refresh","a relationship"],"hard"),
 ("SUM vs SUMX","SUMX differs from SUM because it ______.",
   "evaluates an expression row by row before summing",["evaluates an expression row by row before summing","is always slower","only works on measures","ignores filters"],"medium"),
 ("Measure totals","A measure total in a matrix can differ from the sum of rows because it is ______.",
   "re-evaluated in the total's filter context",["re-evaluated in the total's filter context","a bug","cached","random"],"hard"),
 ("Implicit measure","Dragging a numeric column into a visual creates an ______.",
   "implicit measure (default aggregation)",["implicit measure (default aggregation)","explicit measure","calculated column","relationship"],"medium"),
 ("Explicit measure","Writing a measure with DAX creates an ______ measure.",
   "explicit",["explicit","implicit","calculated","hidden"],"easy"),
 ("DIVIDE vs /","DIVIDE is preferred over the / operator because it ______.",
   "handles divide-by-zero gracefully",["handles divide-by-zero gracefully","is faster always","returns text","rounds automatically"],"easy"),
 ("Blank in DAX","In DAX, an empty result is represented by ______.",
   "BLANK()",["BLANK()","NULL","0 always","an error"],"easy"),
 ("Star vs flat","Compared with one flat table, a star schema usually gives ______.",
   "simpler DAX and better performance",["simpler DAX and better performance","larger files always","no relationships","slower visuals"],"medium"),
 ("Auto date/time","Power BI's Auto date/time feature creates ______.",
   "a hidden date table for each date column",["a hidden date table for each date column","one shared date table","nothing","a slicer"],"medium"),
 ("Disable auto date","Turning off Auto date/time is recommended to ______.",
   "reduce model size and use your own date table",["reduce model size and use your own date table","speed up visuals only","enable RLS","allow publishing"],"hard"),
 ("Relationship key","A relationship should be built on ______.",
   "a matching key column on both tables",["a matching key column on both tables","any two columns","a measure","a visual"],"easy"),
 ("Data type impact","Choosing the right data type matters because it affects ______.",
   "storage size, sorting and available operations",["storage size, sorting and available operations","only colours","nothing","the theme"],"medium"),
 ("High cardinality","A high-cardinality column (e.g. a GUID) hurts an Import model because it ______.",
   "compresses poorly and inflates model size",["compresses poorly and inflates model size","cannot be filtered","breaks DAX","is always text"],"hard"),
 ("Measure organisation","Storing measures in a dedicated empty 'Measures' table helps by ______.",
   "keeping the field list tidy",["keeping the field list tidy","making them faster","enabling RLS","folding queries"],"medium"),
 ("Number formatting","You set a measure's display format (e.g. currency) in ______.",
   "the Measure tools / Format options",["the Measure tools / Format options","Power Query only","the theme JSON only","RLS"],"easy"),
 ("Sort by column","'Sort by Column' lets you sort e.g. MonthName by ______.",
   "MonthNumber",["MonthNumber","alphabetical text only","a measure","a slicer"],"medium"),
 ("Hierarchy","A hierarchy (Year ▸ Quarter ▸ Month) enables ______ in visuals.",
   "drill-down",["drill-down","RLS","refresh","folding"],"easy"),
 ("Calculated table","A calculated table is created with ______.",
   "a DAX table expression",["a DAX table expression","Power Query M","a visual","a slicer"],"medium"),
 ("What-if parameter","A what-if parameter creates a ______ users can change with a slicer.",
   "single-column table and a measure",["single-column table and a measure","relationship","report theme","gateway"],"hard"),
 ("Field parameters","Field parameters let users ______.",
   "switch which fields a visual shows",["switch which fields a visual shows","change RLS","fold queries","publish"],"hard"),
 ("Report vs dashboard","In the Service, a dashboard differs from a report because it ______.",
   "pins visuals (tiles) from one or more reports onto a single canvas",["pins visuals (tiles) from one or more reports onto a single canvas","is edited in Desktop","holds the data model","is a slicer"],"medium"),
 ("Live connection","A Live connection to a published dataset means the report ______.",
   "uses the shared semantic model without importing data",["uses the shared semantic model without importing data","imports a copy","cannot use measures","is offline"],"hard"),
 ("Dataflow","A Power BI dataflow stores ______.",
   "reusable Power Query transformations in the Service",["reusable Power Query transformations in the Service","visuals","RLS roles","a theme"],"hard"),
 ("Certified vs promoted","Between endorsement levels, 'Certified' is ______ than 'Promoted'.",
   "a higher trust level set by authorised reviewers",["a higher trust level set by authorised reviewers","lower","the same","unrelated"],"medium"),
]
for row in SCEN:
    title,qtext,correct,choices,tier=row
    out.append({"tier":tier,"topic":"Concepts","title":title,"q":qtext.replace("______","…"),"options":opts(correct,choices),"answer":correct,"why":f"{correct}."})

# ---- 9. Read-the-DAX (what does this measure compute) ----
READ=[
 ("CALCULATE([Total Sales], Product[Category]=\"Bikes\")","total sales filtered to the Bikes category","medium"),
 ("DIVIDE([Sales]-[Cost],[Sales])","the profit margin as a ratio","easy"),
 ("SUMX(Sales, Sales[Qty]*Sales[Price])","the sum of quantity times price over every sales row","medium"),
 ("CALCULATE([Sales], ALL(Product))","sales ignoring any filter on the Product table","medium"),
 ("DIVIDE([Sales], CALCULATE([Sales], ALL(Product)))","each product's share of total sales",  "hard"),
 ("CALCULATE([Sales], SAMEPERIODLASTYEAR(Date[Date]))","sales for the same period one year earlier","medium"),
 ("VAR c=[Sales] RETURN IF(c>1000,\"High\",\"Low\")","a High/Low label based on whether sales exceed 1000","medium"),
 ("COUNTROWS(FILTER(Product, Product[Price]>100))","the number of products priced above 100","medium"),
 ("RANKX(ALL(Product), [Sales])","the rank of each product by sales among all products","hard"),
 ("CALCULATE([Sales], KEEPFILTERS(Product[Color]=\"Red\"))","sales for red items without discarding other Product[Color] filters","hard"),
]
readans=[r[1] for r in READ]
for expr,meaning,tier in READ:
    out.append({"tier":tier,"topic":"Read DAX","title":"What does this compute?","q":f"What does this measure compute?  =  {expr}","options":opts(meaning,random.sample(readans,4)),"answer":meaning,"why":f"It returns {meaning}."})

# ---- 10. Spot-the-problem ----
PROB=[
 ("A revenue total is inflated after joining a fact table to a details table. The likely cause is ______.",
   "a one-to-many join causing row duplication (fan-out)",["a one-to-many join causing row duplication (fan-out)","a slicer","the wrong theme","RLS"],"hard"),
 ("A time-intelligence measure returns blank. A common cause is ______.",
   "no proper marked Date table with a continuous date range",["no proper marked Date table with a continuous date range","too many visuals","a missing slicer","import mode"],"hard"),
 ("Refresh is very slow on a DirectQuery report. A typical remedy is ______.",
   "add aggregation tables or switch heavy tables to Import",["add aggregation tables or switch heavy tables to Import","add more visuals","remove the date table","disable slicers"],"hard"),
 ("A slicer on one page doesn't affect a visual on another page. To link them you would ______.",
   "use sync slicers or a shared filter",["use sync slicers or a shared filter","republish","change data type","add RLS"],"medium"),
 ("Two visuals show different totals for 'Sales' unexpectedly. Check whether ______.",
   "they use different filters, measures or interactions",["they use different filters, measures or interactions","the theme changed","the file is corrupt","refresh failed"],"medium"),
 ("A measure works in a card but shows wrong subtotals in a matrix because ______.",
   "totals are evaluated in their own filter context, not summed",["totals are evaluated in their own filter context, not summed","the matrix is broken","DAX is invalid","the data is wrong"],"hard"),
 ("Model file size is huge. The quickest win is usually to ______.",
   "remove unused and high-cardinality columns",["remove unused and high-cardinality columns","add measures","use more pages","enable Q&A"],"medium"),
 ("Users see all rows despite an RLS role. Likely the role ______.",
   "was created but users were not assigned to it in the Service",["was created but users were not assigned to it in the Service","needs a slicer","needs a theme","needs Import mode"],"hard"),
]
for row in PROB:
    qtext,correct,choices,tier=row[0],row[1],row[2],row[3]
    out.append({"tier":tier,"topic":"Troubleshooting","title":"Spot the cause","q":qtext.replace("______","…"),"options":opts(correct,choices),"answer":correct,"why":f"{correct}."})



# ---- 11. Best-visual scenarios (situation -> visual) ----
SCEN2=[
 ("show sales by month across two years for comparison","Line chart"),
 ("compare revenue across 5 product categories","Clustered column chart"),
 ("display a single total revenue figure prominently","Card"),
 ("show progress toward a sales target on a dial","Gauge"),
 ("break a revenue number down interactively by several dimensions","Decomposition tree"),
 ("show the geographic distribution of customers","Map"),
 ("show the correlation between ad spend and sales","Scatter chart"),
 ("show how starting revenue changes with additions and subtractions","Waterfall chart"),
 ("show conversion through the stages of a sales pipeline","Funnel chart"),
 ("show a detailed cross-tab of sales by region and category with drill-down","Matrix"),
 ("let users filter the whole page by year","Slicer"),
 ("show which factors most drive customer churn","Key influencers"),
 ("show rank changes of products across quarters","Ribbon chart"),
 ("show part-to-whole contribution with nested rectangles","Treemap"),
]
_visnames=[v[0] for v in VIS]
for job,name in SCEN2:
    out.append({"tier":"medium","topic":"Choosing visuals","title":"Best visual","q":f"Which visual best helps you {job}?","options":opts(name,random.sample(_visnames,5)),"answer":name,"why":f"A {name} is the standard choice to {job}."})

# ---- 12. DAX operators & syntax ----
OPS=[
 ("The DAX operator for logical AND inside a boolean expression is","&&",["&&","||","AND only","+"]),
 ("The DAX operator for logical OR inside a boolean expression is","||",["||","&&","OR only","-"]),
 ("The DAX operator to concatenate two text values is","&",["&","+","&&","|"]),
 ("In DAX, a fully qualified column reference looks like","Table[Column]",["Table[Column]","[Table].Column","Column.Table","{Table:Column}"]),
 ("A measure reference in DAX is written as","[Measure Name]",["[Measure Name]","Table[Measure]","{Measure}","(Measure)"]),
 ("To write a multi-line variable-based measure you use","VAR ... RETURN",["VAR ... RETURN","LET ... IN","WITH ... AS","DEFINE ... EVAL"]),
 ("Comments in DAX can start with","-- or //",["-- or //","# only","<!-- -->","REM"]),
 ("The result of dividing by zero with the / operator in DAX is","an error or infinity (use DIVIDE instead)",["an error or infinity (use DIVIDE instead)","always 0","always blank","the numerator"]),
 ("A DAX measure always returns","a single scalar value in its context",["a single scalar value in its context","a table","a visual","multiple rows"]),
 ("A DAX table expression (e.g. in a calculated table) returns","a table",["a table","a scalar","text only","a visual"]),
]
for qtext,correct,choices in OPS:
    out.append({"tier":"medium","topic":"DAX syntax","title":"DAX syntax","q":qtext+"…","options":opts(correct,choices),"answer":correct,"why":f"{correct}."})

# ---- 13. Formatting & UX ----
UX=[
 ("You change a measure's number format (e.g. to currency) using","the Measure tools ribbon",["the Measure tools ribbon","Power Query","the theme JSON only","RLS"]),
 ("To make 'MonthName' sort chronologically you use","Sort by Column with a MonthNumber column",["Sort by Column with a MonthNumber column","alphabetical sort","a slicer","a measure"]),
 ("Grouping several data points into ranges (bins) is done with","Group / binning on a column",["Group / binning on a column","a measure","RLS","a theme"]),
 ("To reuse a colour palette across a report you apply","a report theme",["a report theme","conditional formatting only","a bookmark","a gateway"]),
 ("Showing or hiding visuals for a guided story is done with","bookmarks and the selection pane",["bookmarks and the selection pane","RLS","query folding","a gateway"]),
 ("To display units like 1.2M instead of 1200000 you set","the display units / value formatting",["the display units / value formatting","a slicer","a relationship","RLS"]),
 ("A visual header tooltip explaining a KPI can be added via","the visual's tooltip / header icon text",["the visual's tooltip / header icon text","Power Query","a measure name only","RLS"]),
 ("To keep a slicer visible while scrolling you can","use a fixed/synced slicer or a slicer on every page",["use a fixed/synced slicer or a slicer on every page","use DAX","use a gateway","use a theme"]),
]
for qtext,correct,choices in UX:
    out.append({"tier":"easy","topic":"Formatting & UX","title":"Report formatting","q":qtext+"…","options":opts(correct,choices),"answer":correct,"why":f"{correct}."})

# ---- 14. Service features ----
SVC2=[
 ("Pinning a visual to a dashboard creates a","tile",["tile","measure","relationship","slicer"]),
 ("Subscriptions in the Service let users","receive report snapshots by email on a schedule",["receive report snapshots by email on a schedule","edit DAX","create relationships","fold queries"]),
 ("Data alerts can be set on","dashboard tiles (cards/gauges/KPIs)",["dashboard tiles (cards/gauges/KPIs)","any DAX measure directly","slicers","themes"]),
 ("Row-level security is enforced for users with the","Viewer role who are members of a role",["Viewer role who are members of a role","Admin role always ignoring RLS","no role","gateway"]),
 ("A Power BI App audience lets you","give different groups different content/permissions",["give different groups different content/permissions","speed up refresh","write M","create relationships"]),
 ("Usage metrics reports show","how often reports and pages are viewed",["how often reports and pages are viewed","DAX performance only","refresh logs only","RLS roles"]),
 ("Lineage view in a workspace shows","how datasets, dataflows and reports depend on each other",["how datasets, dataflows and reports depend on each other","visual formatting","RLS","the theme"]),
 ("To share outside your org securely you might use","publish to web (public) or B2B sharing (careful with each)",["publish to web (public) or B2B sharing (careful with each)","email the .pbix","a slicer","a gateway only"]),
 ("Scorecards / metrics in the Service are used to","track KPIs against targets over time",["track KPIs against targets over time","design visuals","fold queries","set themes"]),
 ("A certified semantic model signals that it is","trusted and governed for reuse",["trusted and governed for reuse","faster","larger","public"]),
]
for qtext,correct,choices in SVC2:
    out.append({"tier":"medium","topic":"Power BI Service","title":"Service feature","q":qtext+"…","options":opts(correct,choices),"answer":correct,"why":f"{correct}."})

# de-dupe by (q) and cap
seen=set(); uniq=[]
for x in out:
    if x["q"] in seen: continue
    seen.add(x["q"]); uniq.append(x)
random.shuffle(uniq)
# merge the hand-written fundamentals file(s)
for f in sorted(os.listdir(here)):
    if f.endswith('.json') and not f.startswith('_'):
        uniq = json.load(open(os.path.join(here,f))) + uniq
json.dump(uniq, open(os.path.join(here,'_generated.json'),'w'), indent=0)
from collections import Counter
print("total", len(uniq), dict(Counter(x['tier'] for x in uniq)), "| topics", len(set(x['topic'] for x in uniq)))
