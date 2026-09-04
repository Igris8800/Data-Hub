"""HR / People Analytics dataset for the pandas track: employees, departments, reviews, salaries (history), leave."""
import random, datetime, csv, io, json, os
random.seed(101)
here=os.path.dirname(os.path.abspath(__file__))
first=['Aarav','Priya','Rohan','Sneha','Vikram','Ananya','Karan','Meera','Arjun','Divya','Rahul','Isha','Nikhil','Pooja','Sid','Kavya','Aditya','Neha','Varun','Riya','Manish','Tanvi','Dev','Shreya','Yash','Sara','Ishaan','Myra','Kabir','Anika','Reyansh','Saanvi','Vihaan','Diya','Advait','Kiara','Atharv','Navya','Rudra','Pari','Zara','Aryan','Nitya','Om','Ira','Kian','Tara','Veer','Mira','Jay','Leah','Noah','Amara','Ryan','Zoya','Ved','Anvi','Ryan','Kyra','Ansh']
last=['Sharma','Patel','Reddy','Iyer','Nair','Gupta','Mehta','Singh','Rao','Joshi','Kulkarni','Desai','Bose','Menon','Verma','Shah','Pillai','Das']
depts=[('Engineering','Bengaluru'),('Sales','Mumbai'),('Marketing','Mumbai'),('Finance','Pune'),('People','Bengaluru'),('Operations','Pune'),('Support','Hyderabad')]
dept_rows=[{'dept_id':i+1,'dept':d,'location':loc,'budget':random.choice([2000000,3500000,5000000,1500000])} for i,(d,loc) in enumerate(depts)]
levels={'L1':(400000,700000),'L2':(700000,1100000),'L3':(1100000,1800000),'L4':(1800000,2800000),'L5':(2800000,4500000)}
emps=[]; 
for i in range(1,121):
    lv=random.choice(['L1','L1','L2','L2','L2','L3','L3','L4','L5'])
    lo,hi=levels[lv]
    hire=datetime.date(2016,1,1)+datetime.timedelta(days=random.randint(0,3400))
    d=random.choice(dept_rows)
    status='Active' if random.random()<0.82 else 'Left'
    left=None
    if status=='Left':
        left=hire+datetime.timedelta(days=random.randint(200,3000))
        if left>datetime.date(2025,7,31): left=datetime.date(2025,7,31)
    emps.append({'emp_id':1000+i,'name':f"{random.choice(first)} {random.choice(last)}",'dept_id':d['dept_id'],
        'level':lv,'salary':round(random.uniform(lo,hi)/1000)*1000,'gender':random.choice(['F','M','M','F']),
        'hire_date':hire.isoformat(),'status':status,'exit_date':left.isoformat() if left else '',
        'manager_id': '' if i<=8 else 1000+random.randint(1,8),
        'remote':random.choice([0,0,1]),'age':random.randint(23,58)})
# a couple of data issues
emps[15]['salary']=None; emps[40]['exit_date']='2025-09-01'  # exit after cutoff (future)
reviews=[]; rid=0
for e in emps:
    for yr in [2022,2023,2024]:
        if random.random()<0.85:
            rid+=1
            reviews.append({'review_id':rid,'emp_id':e['emp_id'],'year':yr,
                'rating':random.choice([2,3,3,3,4,4,4,5]),'promoted':random.choice([0,0,0,0,1])})
leave=[]; lid=0
for e in random.sample(emps,90):
    for _ in range(random.randint(1,5)):
        lid+=1; st=datetime.date(2025,1,1)+datetime.timedelta(days=random.randint(0,200))
        leave.append({'leave_id':lid,'emp_id':e['emp_id'],'type':random.choice(['Casual','Sick','Earned','Earned','Unpaid']),
            'start_date':st.isoformat(),'days':random.choice([1,1,2,2,3,5,7])})
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow({k:('' if v is None else v) for k,v in r.items()})
    return buf.getvalue()
ds={"key":"hr","name":"People Analytics (pandas)","tagline":"employees · departments · reviews · leave",
    "color":"#B892FF",
    "intro":"Four DataFrames are preloaded: employees, departments, reviews, leave. pandas is pd, numpy is np. Assign your answer to result.",
    "frames":{"employees":csvstr(emps),"departments":csvstr(dept_rows),"reviews":csvstr(reviews),"leave":csvstr(leave)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()})
