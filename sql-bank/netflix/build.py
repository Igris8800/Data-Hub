import random, datetime, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import emit
random.seed(21)
D=lambda y,m,d: datetime.date(y,m,d)
def col(n,t,tag=None): return {'name':n,'type':t,**({'tag':tag} if tag else {})}
PLANS={'Basic':6.99,'Standard':13.99,'Premium':17.99}
countries=['USA']*8+['India']*7+['UK']*4+['Brazil']*4+['Germany']*3+['Japan']*3+['Mexico']*3+['Canada']*3+['France']*2+['South Korea']*3
first=['sarah','aditya','marco','yuki','amir','priya','chloe','david','lena','rahul','emily','kenji','fatima','luca','ananya','james','sofia','omar','hannah','vikram','grace','mateo','aisha','tom','nina','arjun','zoe','hiro','isabella','sam','leo','maya','ravi','ella','noah','ivy','kai','mila','ari','tara']
users=[]
for i,f in enumerate(first,1):
    sd=D(2022,1,1)+datetime.timedelta(days=random.randint(0,1000))
    plan=random.choice(list(PLANS))
    users.append([i,f"{f}{random.randint(1,99)}@example.com",countries[i-1],plan,sd.isoformat()])
shows=[
 [1,"Stranger Things","Sci-Fi",2016,"Series",52,"TV-14","USA"],[2,"The Crown","Drama",2016,"Series",58,"TV-MA","UK"],[3,"Squid Game","Thriller",2021,"Series",55,"TV-MA","South Korea"],[4,"Money Heist","Thriller",2017,"Series",50,"TV-MA","Spain"],[5,"Bridgerton","Romance",2020,"Series",60,"TV-MA","UK"],[6,"The Witcher","Fantasy",2019,"Series",60,"TV-MA","USA"],[7,"Wednesday","Comedy",2022,"Series",48,"TV-14","USA"],[8,"Dark","Sci-Fi",2017,"Series",55,"TV-MA","Germany"],[9,"Narcos","Crime",2015,"Series",50,"TV-MA","USA"],[10,"Ozark","Crime",2017,"Series",60,"TV-MA","USA"],[11,"Sacred Games","Crime",2018,"Series",50,"TV-MA","India"],[12,"Delhi Crime","Crime",2019,"Series",52,"TV-MA","India"],[13,"Lupin","Thriller",2021,"Series",45,"TV-14","France"],[14,"Alice in Borderland","Sci-Fi",2020,"Series",48,"TV-MA","Japan"],[15,"Elite","Drama",2018,"Series",50,"TV-MA","Spain"],
 [16,"The Irishman","Crime",2019,"Movie",209,"R","USA"],[17,"Extraction","Action",2020,"Movie",116,"R","USA"],[18,"Enola Holmes","Mystery",2020,"Movie",123,"PG-13","UK"],[19,"Roma","Drama",2018,"Movie",135,"R","Mexico"],[20,"Bird Box","Thriller",2018,"Movie",124,"R","USA"],[21,"Don't Look Up","Comedy",2021,"Movie",138,"R","USA"],[22,"RRR","Action",2022,"Movie",187,"PG-13","India"],[23,"Marriage Story","Drama",2019,"Movie",137,"R","USA"],[24,"Okja","Fantasy",2017,"Movie",120,"PG-13","South Korea"],[25,"Glass Onion","Mystery",2022,"Movie",139,"PG-13","USA"],
 [26,"Our Planet","Documentary",2019,"Series",50,"TV-G","UK"],[27,"Chef's Table","Documentary",2015,"Series",50,"TV-MA","USA"],[28,"Tiger King","Documentary",2020,"Series",45,"TV-MA","USA"],[29,"CoComelon","Kids",2020,"Series",30,"TV-Y","USA"],[30,"The Sea Beast","Kids",2022,"Movie",115,"PG","USA"],
]
subs=[];sid=0
for u in users:
    start=D.fromisoformat(u[4]) if False else datetime.date.fromisoformat(u[4])
    plan=random.choice(list(PLANS)); n=random.choice([1,1,1,2,2,3]); cur=start
    for k in range(n):
        sid+=1; length=random.randint(60,400)
        end=cur+datetime.timedelta(days=length); last=(k==n-1)
        if last:
            if random.random()<0.3: status='cancelled'; end_s=end.isoformat() if end<=D(2025,7,31) else D(2025,7,31).isoformat()
            else: status='active'; end_s=None
        else: status='upgraded' if random.random()<0.6 else 'downgraded'; end_s=end.isoformat()
        subs.append([sid,u[0],plan,PLANS[plan],cur.isoformat(),end_s,status])
        order=['Basic','Standard','Premium']; i=order.index(plan)
        plan=order[min(i+1,2)] if status=='upgraded' else order[max(i-1,0)] if status=='downgraded' else plan
        cur=end
    u[3]=plan
active_end={s[1]:s for s in subs}
views=[];vid=0;devices=['TV']*5+['Mobile']*3+['Laptop']*2+['Tablet']
for u in users:
    start=datetime.date.fromisoformat(u[4]); s=active_end[u[0]]
    stop=datetime.date.fromisoformat(s[5]) if s[5] else D(2025,7,31)
    fav=random.sample(shows[:28], k=random.randint(2,6))  # shows 29-30 never watched
    for _ in range(random.randint(3,16)):
        vid+=1; sh=random.choice(fav+[random.choice(shows[:28])])
        d=start+datetime.timedelta(days=random.randint(0,max(1,(stop-start).days)))
        cap=sh[5]; mins=random.randint(5,cap); completed=1 if mins>=cap*0.9 else 0
        views.append([vid,u[0],sh[0],d.isoformat(),mins,random.choice(devices),completed])
# binge day: a few users watch 3+ episodes of one show on a single day
for u in random.sample(users,6):
    sh=random.choice([s for s in shows if s[4]=='Series']); d=D(2025,3,random.randint(1,28))
    for _ in range(random.randint(3,5)):
        vid+=1; views.append([vid,u[0],sh[0],d.isoformat(),sh[5],'TV',1])
# --- deliberate imperfections for audit / edge-case questions ---
prem=[u for u in users if u[3]=='Premium'][:2]
for u in prem:
    for v in views:
        if v[1]==u[0]: v[5]=random.choice(['Mobile','Laptop'])           # Premium users who never used a TV
for v in random.sample(views,3): v[4]=next(sh for sh in shows if sh[0]==v[2])[5]+random.randint(5,40)   # minutes > runtime
for v in random.sample(views,2):
    su=next(u for u in users if u[0]==v[1]); v[3]=(datetime.date.fromisoformat(su[4])-datetime.timedelta(days=random.randint(3,20))).isoformat()  # session before signup
users[4][3]='Basic' if users[4][3]!='Basic' else 'Premium'; users[17][3]='Standard' if users[17][3]!='Standard' else 'Basic'   # users.plan out of sync
for sh_id in (26,27,28):                                                # one completionist of every Documentary
    vid+=1; views.append([vid,users[2][0],sh_id,'2025-02-1%d'%(sh_id-25),50,'TV',1])
ratings=[];rid=0
for v in random.sample(views,90):
    rid+=1; ratings.append([rid,v[1],v[2],random.randint(1,5),v[3]])
for u,sh in ((7,3),(12,16),(20,25)):                                   # ratings with no matching session
    if not any(v[1]==u and v[2]==sh for v in views): rid+=1; ratings.append([rid,u,sh,random.randint(1,5),'2025-05-10'])
tables=[
 {'name':'users','color':'#E50914','columns':[col('user_id','INTEGER','PK'),col('email','TEXT'),col('country','TEXT'),col('plan','TEXT'),col('signup_date','TEXT')],'rows':users},
 {'name':'shows','color':'#E50914','columns':[col('show_id','INTEGER','PK'),col('title','TEXT'),col('genre','TEXT'),col('release_year','INTEGER'),col('type','TEXT'),col('duration_min','INTEGER'),col('maturity_rating','TEXT'),col('origin_country','TEXT')],'rows':shows},
 {'name':'watch_history','color':'#E50914','columns':[col('view_id','INTEGER','PK'),col('user_id','INTEGER','FK'),col('show_id','INTEGER','FK'),col('watch_date','TEXT'),col('minutes_watched','INTEGER'),col('device','TEXT'),col('completed','INTEGER')],'rows':views},
 {'name':'subscriptions','color':'#E50914','columns':[col('subscription_id','INTEGER','PK'),col('user_id','INTEGER','FK'),col('plan','TEXT'),col('monthly_price','REAL'),col('start_date','TEXT'),col('end_date','TEXT'),col('status','TEXT')],'rows':subs},
 {'name':'ratings','color':'#E50914','columns':[col('rating_id','INTEGER','PK'),col('user_id','INTEGER','FK'),col('show_id','INTEGER','FK'),col('rating','INTEGER'),col('rated_at','TEXT')],'rows':ratings},
]
company={'key':'netflix','name':'Netflix','tagline':'Streaming · Subscriptions · Engagement','color':'#E50914','logo':'🎬','logoUrl':'https://cdn.simpleicons.org/netflix/E50914'}
here=os.path.dirname(os.path.abspath(__file__)); qs=[]
for f in sorted(os.listdir(here)):
    if f.startswith('questions_') and f.endswith('.json'): qs+=json.load(open(os.path.join(here,f)))
emit(company,tables,qs)
