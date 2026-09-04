"""Statistics dataset: two experiment/observational tables for hands-on inference.
 - measurements: groups A/B with a numeric value (for t-tests, CIs)
 - experiment: control vs treatment conversions (for proportions/chi-square)
 - sample: a single numeric sample column (descriptive stats, normality)
 - paired: before/after measurements per subject (paired t-test, regression)
"""
import random, csv, io, json, os
random.seed(404)
here=os.path.dirname(os.path.abspath(__file__))
def normal(mu,sd,n): return [round(random.gauss(mu,sd),2) for _ in range(n)]
# Two-group measurements: A ~ N(50,8), B ~ N(54,8) so there's a real but modest difference
A=normal(50,8,40); B=normal(54,8,40)
meas=[{'group':'A','value':v} for v in A]+[{'group':'B','value':v} for v in B]
random.shuffle(meas)
meas=[{'obs_id':i+1, **r} for i,r in enumerate(meas)]
# A/B experiment: control 12% conv of 600, treatment 15% of 600
def conv(n,p): return sum(1 for _ in range(n) if random.random()<p)
ctrl_n, treat_n = 600, 600
ctrl_c, treat_c = conv(ctrl_n,0.12), conv(treat_n,0.15)
experiment=[{'variant':'control','visitors':ctrl_n,'conversions':ctrl_c},
            {'variant':'treatment','visitors':treat_n,'conversions':treat_c}]
# Single sample (slightly skewed): heights-like
sample=[{'sample_id':i+1,'x':round(random.gauss(170,10),1)} for i in range(60)]
# Paired before/after: after = before + improvement + noise; also gives x,y for regression
paired=[]
for i in range(30):
    before=round(random.gauss(100,15),1)
    after=round(before+random.gauss(6,5),1)
    paired.append({'subject':i+1,'before':before,'after':after})
# Regression pair: study hours vs score
reg=[]
for i in range(50):
    hours=round(random.uniform(0,10),1)
    score=round(40+5.5*hours+random.gauss(0,6),1)
    reg.append({'student':i+1,'hours':hours,'score':min(100,max(0,score))})
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow(r)
    return buf.getvalue()
ds={"key":"stats","name":"Statistics Lab (scipy)","tagline":"measurements · experiment · sample · paired · regression",
    "color":"#B892FF","needs_scipy":True,
    "intro":"Five DataFrames are preloaded: measurements (group A/B, value), experiment (A/B test counts), sample (x), paired (before/after), regression (hours, score). pandas is pd, numpy is np, and scipy.stats is imported as stats. Assign your answer to result.",
    "frames":{"measurements":csvstr(meas),"experiment":csvstr(experiment),"sample":csvstr(sample),"paired":csvstr(paired),"regression":csvstr(reg)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()}, 'ctrl_c',ctrl_c,'treat_c',treat_c)
