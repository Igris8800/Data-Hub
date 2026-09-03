import random, datetime, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import emit
random.seed(55)
D=lambda y,m,d: datetime.date(y,m,d)
def col(n,t,tag=None): return {'name':n,'type':t,**({'tag':tag} if tag else {})}
countries=['USA']*10+['India']*12+['Brazil']*6+['UK']*5+['Indonesia']*5+['Mexico']*4+['Germany']*4+['Nigeria']*4
names=['Aarav','Bella','Carlos','Diya','Emma','Felix','Gita','Hugo','Ines','Jai','Kira','Liam','Maya','Noor','Omar','Pia','Quinn','Rhea','Sam','Tara','Uma','Vik','Wren','Xena','Yara','Zane','Ava','Ben','Cleo','Dev','Eli','Fay','Gus','Hana','Ira','Jude','Kai','Lea','Max','Nia','Otis','Pax','Rae','Sol','Theo','Uri','Vera','Wes','Yuki','Zoe']
users=[]
for i,n in enumerate(names,1):
    sd=D(2022,1,1)+datetime.timedelta(days=random.randint(0,1200))
    users.append([i,n,countries[i-1],sd.isoformat(),random.choice([0,0,0,0,1]),random.choice([18,22,25,29,31,35,40,45,52])])
# friendships: undirected, stored with user_a < user_b; a few clusters + hubs
fr=set()
def add(a,b,d=None):
    if a==b: return
    a,b=min(a,b),max(a,b); fr.add((a,b,d or (D(2022,6,1)+datetime.timedelta(days=random.randint(0,1100))).isoformat()))
for cl in ([1,2,3,4,5,6],[7,8,9,10,11],[12,13,14,15,16,17,18],[19,20,21,22],[23,24,25,26,27,28]):
    for i in cl:
        for j in cl:
            if i<j and random.random()<0.75: add(i,j)
for hub in (3,14,30):
    for k in random.sample(range(1,51),14): add(hub,k)
for _ in range(60): add(random.randint(1,50),random.randint(1,50))
friendships=[[i+1,a,b,d] for i,(a,b,d) in enumerate(sorted(fr))]
platforms=['Facebook']*4+['Instagram']*5+['Threads']
types=['photo']*4+['video']*3+['text']*2+['reel']*3
posts=[];pid=0
for u in users:
    start=datetime.date.fromisoformat(u[3])
    for _ in range(random.randint(0,12)):
        pid+=1; d=start+datetime.timedelta(days=random.randint(0,max(1,(D(2025,7,31)-start).days)))
        pf=random.choice(platforms); ty=random.choice(types)
        reach=random.randint(50,4000)*(3 if u[4] else 1)
        likes=int(reach*random.uniform(0.02,0.15)); comments=int(likes*random.uniform(0.02,0.3)); shares=int(likes*random.uniform(0,0.2))
        posts.append([pid,u[0],pf,ty,d.isoformat(),reach,likes,comments,shares])
# viral posts
for u in random.sample(users,4):
    pid+=1; posts.append([pid,u[0],'Instagram','reel','2025-06-1%d'%random.randint(0,9),120000,18000,1400,5200])
reactions=[];rxid=0
for p in random.sample(posts,180):
    for _ in range(random.randint(1,4)):
        rxid+=1; who=random.randint(1,50)
        reactions.append([rxid,p[0],who,random.choice(['like']*6+['love','haha','wow','sad','angry']),(datetime.date.fromisoformat(p[4])+datetime.timedelta(days=random.randint(0,5))).isoformat()])
# --- deliberate imperfections ---
friendships.append([len(friendships)+1,9,4,'2024-02-02']); friendships.append([len(friendships)+1,17,17,'2024-03-03'])   # reversed / self edge (m-07)
posts[7][6]=posts[7][5]+40                                                                                              # likes exceed reach (m-32)
reactions[3][4]=(datetime.date.fromisoformat(next(p for p in posts if p[0]==reactions[3][1])[4])-datetime.timedelta(days=2)).isoformat()  # reaction before post (m-33)
viral=[p for p in posts if p[5]>10000]                                                                                  # a superfan reacting to every viral post (h-28)
for p in viral: rxid+=1; reactions.append([rxid,p[0],26,'love',(datetime.date.fromisoformat(p[4])+datetime.timedelta(days=1)).isoformat()])
advs=[('Shopify','Retail'),('Duolingo','Education'),('Spotify','Media'),('Nykaa','Beauty'),('Zepto','Grocery'),('Ola','Mobility'),('Byju','Education'),('Puma','Retail'),('Swiggy','Food'),('Canva','Software')]
camps=[]
for i,(a,v) in enumerate(advs,1):
    imp=random.randint(20000,400000); clicks=int(imp*random.uniform(0.005,0.03)); conv=int(clicks*random.uniform(0.02,0.12))
    camps.append([i,a,v,random.choice(['Facebook','Instagram']),random.choice(['18-24','25-34','35-44','all']),random.randint(2000,40000),imp,clicks,conv,random.choice(['active','active','ended','paused'])])
tables=[
 {'name':'users','color':'#1877F2','columns':[col('user_id','INTEGER','PK'),col('name','TEXT'),col('country','TEXT'),col('signup_date','TEXT'),col('is_creator','INTEGER'),col('age','INTEGER')],'rows':users},
 {'name':'friendships','color':'#1877F2','columns':[col('friendship_id','INTEGER','PK'),col('user_a','INTEGER','FK'),col('user_b','INTEGER','FK'),col('created_at','TEXT')],'rows':friendships},
 {'name':'posts','color':'#1877F2','columns':[col('post_id','INTEGER','PK'),col('user_id','INTEGER','FK'),col('platform','TEXT'),col('post_type','TEXT'),col('post_date','TEXT'),col('reach','INTEGER'),col('likes','INTEGER'),col('comments','INTEGER'),col('shares','INTEGER')],'rows':posts},
 {'name':'reactions','color':'#1877F2','columns':[col('reaction_id','INTEGER','PK'),col('post_id','INTEGER','FK'),col('user_id','INTEGER','FK'),col('reaction','TEXT'),col('reacted_at','TEXT')],'rows':reactions},
 {'name':'ad_campaigns','color':'#1877F2','columns':[col('campaign_id','INTEGER','PK'),col('advertiser','TEXT'),col('vertical','TEXT'),col('platform','TEXT'),col('age_target','TEXT'),col('spend','INTEGER'),col('impressions','INTEGER'),col('clicks','INTEGER'),col('conversions','INTEGER'),col('status','TEXT')],'rows':camps},
]
company={'key':'meta','name':'Meta','tagline':'Social graph · Engagement · Creators','color':'#1877F2','logo':'👥','logoUrl':'https://cdn.simpleicons.org/meta/1877F2'}
here=os.path.dirname(os.path.abspath(__file__)); qs=[]
for f in sorted(os.listdir(here)):
    if f.startswith('questions_') and f.endswith('.json'): qs+=json.load(open(os.path.join(here,f)))
emit(company,tables,qs)
