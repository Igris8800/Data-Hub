import random, datetime, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import emit
random.seed(33)
D=lambda y,m,d: datetime.date(y,m,d)
def col(n,t,tag=None): return {'name':n,'type':t,**({'tag':tag} if tag else {})}
cities=['Bengaluru','Mumbai','Delhi','Hyderabad','Pune']
dn=['Ravi Kumar','Suresh Nair','Amit Yadav','Manoj Singh','Deepak Rao','Farhan Ali','Kiran Reddy','Vijay Patil','Anil Sharma','Rakesh Gupta','Sunil Joshi','Prakash Mehta','Imran Khan','Ganesh Iyer','Harish Babu','Naveen Kumar','Santosh Pawar','Mohan Das','Ajay Verma','Rahul Sethi','Arun Prasad','Dinesh Kadam','Sanjay Roy','Vinod Tiwari','Nitin Bhat']
drivers=[]
for i,n in enumerate(dn,1):
    jd=D(2021,1,1)+datetime.timedelta(days=random.randint(0,1400))
    drivers.append([i,n,random.choice(cities),round(random.uniform(3.6,5.0),2),jd.isoformat(),random.choice(['UberGo','UberGo','Premier','Auto','Moto'])])
rn=['Ananya','Rohit','Sneha','Karan','Meera','Arjun','Divya','Nikhil','Pooja','Sid','Kavya','Aditya','Neha','Varun','Riya','Manish','Tanvi','Dev','Shreya','Yash','Isha','Rahul','Priya','Vikram','Aarav','Zara','Ishaan','Myra','Kabir','Anika','Reyansh','Saanvi','Vihaan','Diya','Advait','Kiara','Atharv','Navya','Rudra','Pari']
riders=[]
for i,n in enumerate(rn,1):
    sd=D(2023,1,1)+datetime.timedelta(days=random.randint(0,900))
    riders.append([i,n,random.choice(cities),sd.isoformat()])
rides=[];rid=5000;ratings=[];rtid=0
base={'UberGo':(40,11),'Premier':(60,16),'Auto':(25,8),'Moto':(15,5)}
for _ in range(320):
    rid+=1; r=random.choice(riders)
    same=[d for d in drivers if d[2]==r[2]]; d=random.choice(same if random.random()<0.95 else drivers)
    dt=D(2025,1,1)+datetime.timedelta(days=random.randint(0,210))
    hour=random.choice([7,8,8,9,9,10,12,13,17,18,18,19,19,20,21,22,23,0,2])
    pickup=f"{hour:02d}:{random.randint(0,59):02d}"
    km=round(random.uniform(1.5,28),1); b,pk=base[d[5]]
    surge=random.choice([1.0]*6+[1.2,1.5,1.5,1.8,2.0]) if hour in (8,9,18,19,20) else random.choice([1.0]*9+[1.2])
    st=random.choice(['completed']*8+['cancelled_by_rider','cancelled_by_driver','no_show'])
    dur=int(km*random.uniform(2.2,4.0)) if st=='completed' else None
    fare=round((b+pk*km)*surge,2) if st=='completed' else (round(random.choice([0,30,50]),2) if st!='no_show' else 0)
    rides.append([rid,d[0],r[0],fare,km,dt.isoformat(),pickup,dur,surge,st,round(random.uniform(1,12),1) if st=='completed' else None])
    if st=='completed' and random.random()<0.55:
        rtid+=1; tip=random.choice([0,0,0,10,20,30,50]); ratings.append([rtid,rid,random.choice([5,5,5,4,4,3,2,1]),tip])
shifts=[];shid=0
for d in drivers:
    for k in range(random.randint(25,60)):
        shid+=1; day=D(2025,1,1)+datetime.timedelta(days=random.randint(0,210))
        shifts.append([shid,d[0],day.isoformat(),round(random.uniform(2,11),1)])
# imperfections: one driver with no rides; two riders with no rides; a ride with distance 0
drivers.append([26,'Yusuf Sheikh','Pune',4.8,'2025-06-20','UberGo'])
riders.append([41,'Guest User','Delhi','2025-07-01']); riders.append([42,'Test Rider','Mumbai','2025-07-15'])
rides[10][4]=0.0
riders.append([43,'Chennai Pilot','Chennai','2025-06-01'])                                    # rider city with no drivers (m-23)
rides[20][5]=(datetime.date.fromisoformat(next(d for d in drivers if d[0]==rides[20][1])[4])-datetime.timedelta(days=5)).isoformat()  # ride before driver joined (m-28)
star=drivers[0]                                                                              # driver 1 serves every rider city (h-24)
for ci,city in enumerate(cities+['Chennai']):
    rr=next(r for r in riders if r[2]==city); rid+=1
    rides.append([rid,star[0],rr[0],180.0,9.0,'2025-04-1%d'%ci,'10:0%d'%ci,22,1.0,'completed',3.0])
for v in rides[30:33]: v[7]=max(1,int(v[4]*0.5)) if v[9]=='completed' else v[7]             # implausibly fast rides (h-26)
for k in range(3):                                                                           # back-to-back rides for driver 2 (h-29)
    rid+=1; rides.append([rid,2,riders[k][0],120.0+k,5.0,'2025-05-05','14:%02d'%(5+k*8),12,1.0,'completed',2.5])
perfect=[r for r in rides if r[1]==3 and r[9]=='completed'][:4]                              # driver 3 has only 5-star ratings (h-31)
ratings=[x for x in ratings if x[1] not in {r[0] for r in rides if r[1]==3}]
for r in perfect: rtid+=1; ratings.append([rtid,r[0],5,20])
tables=[
 {'name':'drivers','color':'#00D4FF','columns':[col('driver_id','INTEGER','PK'),col('name','TEXT'),col('city','TEXT'),col('rating','REAL'),col('join_date','TEXT'),col('vehicle_type','TEXT')],'rows':drivers},
 {'name':'riders','color':'#00D4FF','columns':[col('rider_id','INTEGER','PK'),col('name','TEXT'),col('city','TEXT'),col('signup_date','TEXT')],'rows':riders},
 {'name':'rides','color':'#00D4FF','columns':[col('ride_id','INTEGER','PK'),col('driver_id','INTEGER','FK'),col('rider_id','INTEGER','FK'),col('fare','REAL'),col('distance_km','REAL'),col('ride_date','TEXT'),col('pickup_time','TEXT'),col('duration_min','INTEGER'),col('surge_multiplier','REAL'),col('status','TEXT'),col('wait_min','REAL')],'rows':rides},
 {'name':'ride_ratings','color':'#00D4FF','columns':[col('rating_id','INTEGER','PK'),col('ride_id','INTEGER','FK'),col('stars','INTEGER'),col('tip','REAL')],'rows':ratings},
 {'name':'driver_shifts','color':'#00D4FF','columns':[col('shift_id','INTEGER','PK'),col('driver_id','INTEGER','FK'),col('shift_date','TEXT'),col('hours_online','REAL')],'rows':shifts},
]
company={'key':'uber','name':'Uber','tagline':'Rides · Drivers · Surge · Marketplace','color':'#000000','logo':'🚗','logoUrl':'https://cdn.simpleicons.org/uber/FFFFFF'}
here=os.path.dirname(os.path.abspath(__file__)); qs=[]
for f in sorted(os.listdir(here)):
    if f.startswith('questions_') and f.endswith('.json'): qs+=json.load(open(os.path.join(here,f)))
emit(company,tables,qs)
