"""Streaming analytics dataset: users, titles, streams (watch events), subscriptions."""
import random, datetime, csv, io, json, os
random.seed(202)
here=os.path.dirname(os.path.abspath(__file__))
countries=['US','India','UK','Brazil','Germany','Japan','Canada','Australia']
plans=['Basic','Standard','Premium']
users=[]
for i in range(1,201):
    signup=datetime.date(2023,1,1)+datetime.timedelta(days=random.randint(0,850))
    users.append({'user_id':i,'country':random.choice(countries),'plan':random.choice(plans),
        'signup_date':signup.isoformat(),'age':random.randint(16,70)})
genres=['Drama','Comedy','Action','Documentary','Thriller','Kids','Sci-Fi','Romance']
kinds=['Movie','Series']
titles=[]
for i in range(1,61):
    kind=random.choice(kinds)
    titles.append({'title_id':i,'title':f"Title {i}",'genre':random.choice(genres),'kind':kind,
        'release_year':random.randint(2015,2024),'runtime_min':random.randint(80,140) if kind=='Movie' else random.randint(25,55),
        'seasons': (random.randint(1,6) if kind=='Series' else '')})
streams=[]; sid=0
for u in users:
    start=datetime.date.fromisoformat(u['signup_date'])
    n=random.randint(0,40)
    for _ in range(n):
        sid+=1; t=random.choice(titles[:58])  # titles 59,60 stay unwatched (catalogue-gap questions)
        d=start+datetime.timedelta(days=random.randint(0,max(1,(datetime.date(2025,7,31)-start).days)))
        watched=random.randint(1,t['runtime_min'])
        streams.append({'stream_id':sid,'user_id':u['user_id'],'title_id':t['title_id'],
            'watch_date':d.isoformat(),'minutes_watched':watched,
            'completed':1 if watched>=0.9*t['runtime_min'] else 0,
            'device':random.choice(['TV','Mobile','Web','Tablet'])})
# subscriptions: monthly rows with amount by plan
price={'Basic':199,'Standard':499,'Premium':799}
subs=[]; subid=0
for u in users:
    start=datetime.date.fromisoformat(u['signup_date']).replace(day=1)
    months=random.randint(1,18)
    churn=random.random()<0.3
    for m in range(months):
        subid+=1
        mdate=(start+datetime.timedelta(days=32*m)).replace(day=1)
        if mdate>datetime.date(2025,7,1): break
        subs.append({'sub_id':subid,'user_id':u['user_id'],'month':mdate.isoformat(),
            'plan':u['plan'],'amount':price[u['plan']],'active':1})
# a couple issues
streams[10]['minutes_watched']=None
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow({k:('' if v is None else v) for k,v in r.items()})
    return buf.getvalue()
ds={"key":"streaming","name":"Streaming Analytics (pandas)","tagline":"users · titles · streams · subscriptions",
    "color":"#EF476F",
    "intro":"Four DataFrames are preloaded: users, titles, streams, subscriptions. pandas is pd, numpy is np. Assign your answer to result.",
    "frames":{"users":csvstr(users),"titles":csvstr(titles),"streams":csvstr(streams),"subscriptions":csvstr(subs)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()})
