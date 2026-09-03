import random, datetime, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import emit
random.seed(44)
D=lambda y,m,d: datetime.date(y,m,d)
def col(n,t,tag=None): return {'name':n,'type':t,**({'tag':tag} if tag else {})}
countries=['USA','India','UK','Germany','Brazil','Japan','Canada','Australia']
users=[]
for i in range(1,51):
    sd=D(2023,1,1)+datetime.timedelta(days=random.randint(0,850))
    users.append([i,f"user{i}@gmail.com",random.choice(countries),random.choice(['mobile','mobile','desktop','tablet']),sd.isoformat()])
QUERIES=[("best budget laptop","Shopping"),("weather tomorrow","Local"),("python list comprehension","Tech"),("flights to tokyo","Travel"),("how to make sourdough","Food"),("iphone 16 review","Shopping"),("nearest coffee shop","Local"),("sql window functions","Tech"),("hotels in goa","Travel"),("pasta recipe","Food"),("running shoes","Shopping"),("javascript async await","Tech"),("train to mumbai","Travel"),("vegan dinner ideas","Food"),("noise cancelling headphones","Shopping"),("what is a cte","Tech"),("cheap flights","Travel"),("pizza near me","Local"),("standing desk","Shopping"),("react hooks tutorial","Tech")]
searches=[];sid=0
for u in users:
    start=datetime.date.fromisoformat(u[4])
    for _ in range(random.randint(4,18)):
        sid+=1; q,cat=random.choice(QUERIES); d=start+datetime.timedelta(days=random.randint(0,max(1,(D(2025,7,31)-start).days)))
        t=f"{random.randint(0,23):02d}:{random.randint(0,59):02d}"
        results=random.choice([0,0,12,45,120,340,900,1500]) if random.random()<0.12 else random.choice([12,45,120,340,900,1500])
        clicked=0 if results==0 else random.choice([1,1,1,0])
        searches.append([sid,u[0],q,cat,d.isoformat(),t,results,clicked])
# refinement pairs: same user, same day, query extended within minutes
for u in random.sample(users,8):
    d=D(2025,5,random.randint(1,28)); base=random.choice(["laptop","headphones","hotels"])
    for k,q in enumerate([base,base+" under 500",base+" under 500 review"]):
        sid+=1; searches.append([sid,u[0],q,"Shopping",d.isoformat(),f"19:{10+k*3:02d}",340,1 if k==2 else 0])
advs=['Nike','Samsung','Expedia','HelloFresh','Dell','Airbnb','Sony','Zomato','Coursera','Adidas']
camps=[]
for i,a in enumerate(advs,1):
    s=D(2025,1,1)+datetime.timedelta(days=random.randint(0,90)); e=s+datetime.timedelta(days=random.randint(30,150))
    camps.append([i,a,random.choice(['Shopping','Travel','Food','Tech','Shopping']),random.choice([5000,10000,20000,50000]),round(random.uniform(0.3,2.5),2),s.isoformat(),e.isoformat(),random.choice(['active','active','paused','ended'])])
imps=[];iid=0
for _ in range(700):
    iid+=1; c=random.choice(camps); u=random.choice(users)
    s=datetime.date.fromisoformat(c[5]); e=datetime.date.fromisoformat(c[6]); d=s+datetime.timedelta(days=random.randint(0,(e-s).days))
    pos=random.choice([1,1,1,2,2,3,4]); clicked=1 if random.random()<{1:0.12,2:0.07,3:0.04,4:0.02}[pos] else 0
    cost=round(c[4]*random.uniform(0.7,1.3),2) if clicked else 0.0
    conv=1 if clicked and random.random()<0.25 else 0
    rev=round(random.uniform(20,300),2) if conv else 0.0
    imps.append([iid,c[0],u[0],d.isoformat(),pos,clicked,cost,conv,rev])
# --- deliberate edge cases ---
imps[3][3]=(datetime.date.fromisoformat(camps[imps[3][1]-1][5])-datetime.timedelta(days=4)).isoformat()   # impression before flight (m-08)
imps[5][7]=1; imps[5][5]=0; imps[5][6]=0.0                                                              # conversion without click (m-09)
camps.append([11,'Lego','Shopping',8000,1.1,'2025-08-01','2025-09-30','paused'])                        # campaign with no impressions (m-10)
users.append([51,'newbie@gmail.com','Canada','mobile','2025-07-29']); users.append([52,'lurker@gmail.com','UK','desktop','2025-07-30'])   # never searched (m-11)
sid+=1; searches.append([sid,3,'quantum computing basics','Tech','2025-06-02','11:20',900,1])          # queries searched once (m-16)
sid+=1; searches.append([sid,9,'best telescope for beginners','Shopping','2025-06-03','21:05',340,1])
searched_only=[u for u in users if u[0]==users[-1][0]-2]                                               # searcher never shown an ad (m-18)
imps=[i for i in imps if i[2]!=4]
# ahead-of-pace campaign (h-10): concentrate spend early for campaign 5
for i in imps:
    if i[1]==5: i[3]=camps[4][5]; i[6]=round(i[6]*1.6,2)
# campaign whose every click converted (h-31): campaign 9
for i in imps:
    if i[1]==9 and i[5]==1: i[7]=1; i[8]=i[8] or 120.0
# realistic budgets: sized to actual spend; two flights still running past 2025-07-31 for pacing questions
for c in camps[:10]:
    sp=sum(i[6] for i in imps if i[1]==c[0]); c[3]=int(round(sp*random.uniform(1.1,3.0)/5)*5) or 50
camps[4][6]='2025-09-30'; camps[8][6]='2025-10-15'; camps[4][7]='active'; camps[8][7]='active'
camps[4][3]=int(sum(i[6] for i in imps if i[1]==5)*1.15)   # Dell: spent 87% of budget with lots of flight left → ahead of pace
# heavy frequency for one user/campaign/day (frequency-cap question)
for k in range(6): iid+=1; imps.append([iid,2,7,'2025-03-10',1,0,0.0,0,0.0])
orgs=['Search','Ads','Cloud','YouTube','Android']
levels={'L3':(120000,150000),'L4':(150000,200000),'L5':(200000,280000),'L6':(280000,380000),'L7':(380000,500000)}
emps=[[1,'Sundar P','Exec','L7',900000,'Mountain View',None]]
eid=1
for o in orgs:
    eid+=1; vp=eid; emps.append([eid,f"VP {o}",o,'L7',random.randint(*levels['L7']),'Mountain View',1])
    for m in range(2):
        eid+=1; mgr=eid; emps.append([eid,f"{o} Mgr {m+1}",o,'L6',random.randint(*levels['L6']),random.choice(['Mountain View','Bengaluru','London','Zurich']),vp])
        for k in range(random.randint(2,5)):
            eid+=1; lv=random.choice(['L3','L4','L4','L5']); emps.append([eid,f"{o} Eng {m+1}-{k+1}",o,lv,random.randint(*levels[lv]),random.choice(['Mountain View','Bengaluru','London','Zurich','New York']),mgr])
for e in emps:
    if e[3]=='L5' and e[6] and next(m for m in emps if m[0]==e[6])[3]=='L6': e[4]=max(e[4],390000); break   # engineer out-earning manager (m-14)
tables=[
 {'name':'users','color':'#4285F4','columns':[col('user_id','INTEGER','PK'),col('email','TEXT'),col('country','TEXT'),col('device','TEXT'),col('signup_date','TEXT')],'rows':users},
 {'name':'searches','color':'#4285F4','columns':[col('search_id','INTEGER','PK'),col('user_id','INTEGER','FK'),col('query','TEXT'),col('category','TEXT'),col('search_date','TEXT'),col('search_time','TEXT'),col('results_count','INTEGER'),col('clicked','INTEGER')],'rows':searches},
 {'name':'ad_campaigns','color':'#4285F4','columns':[col('campaign_id','INTEGER','PK'),col('advertiser','TEXT'),col('category','TEXT'),col('budget','INTEGER'),col('max_cpc','REAL'),col('start_date','TEXT'),col('end_date','TEXT'),col('status','TEXT')],'rows':camps},
 {'name':'ad_impressions','color':'#4285F4','columns':[col('impression_id','INTEGER','PK'),col('campaign_id','INTEGER','FK'),col('user_id','INTEGER','FK'),col('impression_date','TEXT'),col('position','INTEGER'),col('clicked','INTEGER'),col('cost','REAL'),col('converted','INTEGER'),col('revenue','REAL')],'rows':imps},
 {'name':'employees','color':'#4285F4','columns':[col('employee_id','INTEGER','PK'),col('name','TEXT'),col('org','TEXT'),col('level','TEXT'),col('salary','INTEGER'),col('location','TEXT'),col('manager_id','INTEGER','FK')],'rows':emps},
]
company={'key':'google','name':'Google','tagline':'Search · Ads auction · Org hierarchy','color':'#4285F4','logo':'🔍','logoUrl':'https://cdn.simpleicons.org/google/4285F4'}
here=os.path.dirname(os.path.abspath(__file__)); qs=[]
for f in sorted(os.listdir(here)):
    if f.startswith('questions_') and f.endswith('.json'): qs+=json.load(open(os.path.join(here,f)))
emit(company,tables,qs)
