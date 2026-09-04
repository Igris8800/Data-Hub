"""Exports the Amazon SQL seed as CSV strings for the pandas track (customers, products, orders, order_items, reviews)."""
import json, os, io, csv, sys
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(os.path.dirname(here))
src=open(os.path.join(root,'sql-bank','amazon','build.py')).read().split("company={")[0].replace("emit(company,tables,qs)","")
ns={'__file__':os.path.join(root,'sql-bank','amazon','build.py')}; sys.path.insert(0,os.path.join(root,'sql-bank')); exec(src,ns)
out={}
for t in ns['tables']:
    if t['name'] in ('warehouses','employees'): continue
    buf=io.StringIO(); w=csv.writer(buf); w.writerow([c['name'] for c in t['columns']])
    for r in t['rows']: w.writerow(['' if v is None else v for v in r])
    out[t['name']]=buf.getvalue()
ds={"key":"retail","name":"Retail (pandas)","tagline":"customers · products · orders · order_items · reviews","color":"#FFD166",
    "intro":"Five DataFrames are preloaded: customers, products, orders, order_items, reviews. pandas is imported as pd, numpy as np. Assign your answer to a variable named result.",
    "frames":out}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count('\n')-1 for k,v in out.items()})
