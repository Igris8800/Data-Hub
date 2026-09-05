"""Second statistics dataset: a clinical/experiment scenario for multi-group and modelling inference.
 - trials: three treatment arms (Placebo/DrugA/DrugB) with an outcome score (ANOVA, Tukey-style pairwise)
 - survey: satisfaction (1-5) x region x plan (chi-square of independence, proportions)
 - patients: age, bmi, dose, response (multiple regression, correlation)
 - ab_daily: daily conversions for control/variant over 30 days (proportions over time)
"""
import random, csv, io, json, os
random.seed(606)
here=os.path.dirname(os.path.abspath(__file__))
def norm(mu,sd,n): return [round(random.gauss(mu,sd),2) for _ in range(n)]
# three arms with different means
arms={'Placebo':(50,9,45),'DrugA':(55,9,45),'DrugB':(60,9,45)}
trials=[]; tid=0
for arm,(mu,sd,n) in arms.items():
    for v in norm(mu,sd,n):
        tid+=1; trials.append({'trial_id':tid,'arm':arm,'score':v,'sex':random.choice(['F','M'])})
random.shuffle(trials)
# survey: satisfaction by region and plan
regions=['North','South','East','West']; plans=['Free','Pro','Enterprise']
survey=[]; sid=0
for _ in range(400):
    sid+=1
    plan=random.choice(plans)
    # Pro/Enterprise skew satisfaction higher
    base={'Free':3.0,'Pro':3.6,'Enterprise':4.0}[plan]
    sat=int(min(5,max(1,round(random.gauss(base,1)))))
    survey.append({'resp_id':sid,'region':random.choice(regions),'plan':plan,'satisfaction':sat})
# patients: response depends on dose and bmi
patients=[]; pid=0
for _ in range(80):
    pid+=1
    age=random.randint(30,75); bmi=round(random.uniform(18,38),1); dose=random.choice([10,20,40,80])
    response=round(20 + 0.4*dose - 0.8*(bmi-25) + 0.1*(age-50) + random.gauss(0,5),2)
    patients.append({'patient_id':pid,'age':age,'bmi':bmi,'dose':dose,'response':response})
# ab_daily: 30 days control vs variant
import datetime
ab=[]; day=datetime.date(2025,5,1)
for i in range(30):
    cv_n=random.randint(180,220); cv_c=sum(1 for _ in range(cv_n) if random.random()<0.11)
    tv_n=random.randint(180,220); tv_c=sum(1 for _ in range(tv_n) if random.random()<0.14)
    ab.append({'date':(day+datetime.timedelta(days=i)).isoformat(),'variant':'control','visitors':cv_n,'conversions':cv_c})
    ab.append({'date':(day+datetime.timedelta(days=i)).isoformat(),'variant':'treatment','visitors':tv_n,'conversions':tv_c})
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow(r)
    return buf.getvalue()
ds={"key":"stats2","name":"Experiments Lab (scipy)","tagline":"trials · survey · patients · ab_daily",
    "color":"#EF476F","needs_scipy":True,
    "intro":"Four DataFrames: trials (arm, score), survey (region, plan, satisfaction), patients (age, bmi, dose, response), ab_daily (date, variant, visitors, conversions). pandas is pd, numpy is np, scipy.stats is stats. Assign your answer to result.",
    "frames":{"trials":csvstr(trials),"survey":csvstr(survey),"patients":csvstr(patients),"ab_daily":csvstr(ab)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()})
