import random, datetime, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import emit
random.seed(7)
D=lambda y,m,d: datetime.date(y,m,d)
def col(n,t,tag=None): return {'name':n,'type':t,**({'tag':tag} if tag else {})}

# --- customers (keep original 8, extend to 30) ---
base=[[1,"Sarah","Chen","sarah.chen@example.com","USA",1,"2022-03-14"],[2,"Aditya","Kumar","aditya.k@example.com","India",1,"2022-07-01"],[3,"Marco","Rossi","marco.rossi@example.com","Italy",0,"2023-01-22"],[4,"Yuki","Tanaka","yuki.t@example.com","Japan",1,"2023-02-05"],[5,"Amir","Hassan","amir.hassan@example.com","UAE",0,"2023-06-11"],[6,"Priya","Sharma","priya.s@example.com","India",1,"2023-09-19"],[7,"Chloe","Martin","chloe.m@example.com","France",0,"2024-01-10"],[8,"David","Wilson","david.w@example.com","USA",1,"2024-02-28"]]
more=[("Lena","Fischer","Germany"),("Rahul","Verma","India"),("Emily","Clark","USA"),("Kenji","Sato","Japan"),("Fatima","Zahra","UAE"),("Luca","Bianchi","Italy"),("Ananya","Iyer","India"),("James","Taylor","UK"),("Sofia","Lopez","Spain"),("Omar","Farouk","Egypt"),("Hannah","Kim","South Korea"),("Vikram","Nair","India"),("Grace","Miller","USA"),("Mateo","Garcia","Spain"),("Aisha","Bello","Nigeria"),("Tom","Hughes","UK"),("Nina","Weber","Germany"),("Arjun","Mehta","India"),("Zoe","Baker","USA"),("Hiro","Yamada","Japan"),("Isabella","Costa","Brazil"),("Sam","Reed","USA")]
customers=base[:]
for i,(f,l,c) in enumerate(more,9):
    sd=D(2022,1,1)+datetime.timedelta(days=random.randint(0,900))
    email=f"{f.lower()}.{l.lower()}@example.com" if i%7 else None
    customers.append([i,f,l,email,c,random.choice([1,1,0]),sd.isoformat()])

products=[[101,"Echo Dot (5th Gen)","Electronics",49.99,120],[102,"Kindle Paperwhite","Electronics",139.99,60],[103,"Instant Pot Duo","Kitchen",89.00,40],[104,"AirPods Pro","Electronics",249.00,25],[105,"Lego Star Wars Set","Toys",79.99,75],[106,"Fire TV Stick 4K","Electronics",44.99,200],[107,"Yoga Mat Premium","Sports",29.99,150],
[108,"Ring Video Doorbell","Electronics",99.99,0],[109,"Ninja Air Fryer","Kitchen",119.00,35],[110,"Nespresso Vertuo","Kitchen",179.00,18],[111,"Dumbbell Set 20kg","Sports",64.99,45],[112,"Resistance Bands","Sports",14.99,300],[113,"Hot Wheels 20-Pack","Toys",24.99,90],[114,"Barbie Dreamhouse","Toys",199.99,12],[115,"Atomic Habits (Hardcover)","Books",16.99,500],[116,"The Pragmatic Programmer","Books",39.99,80],[117,"Dune (Paperback)","Books",9.99,0],[118,"Levi's 501 Jeans","Clothing",59.50,110],[119,"Nike Air Zoom","Clothing",129.00,55],[120,"Anker Power Bank","Electronics",34.99,220],[121,"Samsung 27in Monitor","Electronics",229.00,15],[122,"Stainless Knife Set","Kitchen",74.00,60],[123,"Cerave Moisturizer","Beauty",15.49,400],[124,"Dyson Hair Dryer","Beauty",429.00,8]]

warehouses=[[1,"SEA1","Seattle, WA",50000],[2,"BOM3","Mumbai, India",40000],[3,"LHR4","London, UK",35000],[4,"TYO2","Tokyo, Japan",30000],[5,"FRA1","Frankfurt, Germany",28000]]
employees=[[1,"Emma","Johnson","Fulfillment",62000,1],[2,"Liam","Brown","Logistics",58000,1],[3,"Olivia","Davis","Fulfillment",65000,2],[4,"Noah","Miller","Engineering",145000,None],[5,"Ava","Wilson","Logistics",54000,3],[6,"Ethan","Moore","Fulfillment",59000,4],[7,"Sophia","Taylor","Engineering",132000,None]]
extra=[("Mason","Lee","Fulfillment",57000,2),("Mia","Anderson","Logistics",61000,4),("Lucas","Thomas","Fulfillment",56000,5),("Amelia","Jackson","Customer Service",48000,1),("Logan","White","Customer Service",47000,2),("Harper","Harris","Engineering",128000,None),("Elijah","Clark","Logistics",63000,5),("Ella","Lewis","Fulfillment",60000,3),("James","Walker","Fulfillment",58500,1),("Aria","Hall","Finance",92000,None),("Benjamin","Young","Finance",88000,None),("Scarlett","King","Customer Service",49500,3),("Henry","Wright","Logistics",55000,2),("Luna","Scott","Engineering",139000,None),("Jack","Green","Fulfillment",61500,4)]
for i,(f,l,d,s,w) in enumerate(extra,8): employees.append([i,f,l,d,s,w])

# --- orders + order_items (new detail table); orders.total_amount = sum of items ---
orders=[];items=[];oid=5000;iid=70000
statuses=['delivered']*7+['cancelled','returned','pending']
for _ in range(150):
    oid+=1; c=random.choice(customers[:27])  # customers 28-30 never order
    od=D(2024,1,1)+datetime.timedelta(days=random.randint(0,560))
    st=random.choice(statuses); total=0
    for _ in range(random.randint(1,3)):
        iid+=1; p=random.choice(products); qty=random.randint(1,4)
        items.append([iid,oid,p[0],qty,p[3]]); total+=qty*p[3]
    orders.append([oid,c[0],od.isoformat(),round(total,2),st])
# a few deliberately mismatched totals for the audit question
for o in random.sample(orders,4): o[3]=round(o[3]+random.choice([-5,10,25]),2)
reviews=[];rid=9000
for _ in range(80):
    rid+=1; p=random.choice(products[:21]); c=random.choice(customers)  # products 122-124 never reviewed
    reviews.append([rid,p[0],c[0],random.randint(1,5),(D(2024,1,15)+datetime.timedelta(days=random.randint(0,540))).isoformat()])

tables=[
 {'name':'customers','color':'#FF9900','columns':[col('customer_id','INTEGER','PK'),col('first_name','TEXT'),col('last_name','TEXT'),col('email','TEXT'),col('country','TEXT'),col('prime_member','INTEGER'),col('signup_date','TEXT')],'rows':customers},
 {'name':'products','color':'#FF9900','columns':[col('product_id','INTEGER','PK'),col('name','TEXT'),col('category','TEXT'),col('price','REAL'),col('stock','INTEGER')],'rows':products},
 {'name':'orders','color':'#FF9900','columns':[col('order_id','INTEGER','PK'),col('customer_id','INTEGER','FK'),col('order_date','TEXT'),col('total_amount','REAL'),col('status','TEXT')],'rows':orders},
 {'name':'order_items','color':'#FF9900','columns':[col('item_id','INTEGER','PK'),col('order_id','INTEGER','FK'),col('product_id','INTEGER','FK'),col('quantity','INTEGER'),col('unit_price','REAL')],'rows':items},
 {'name':'reviews','color':'#FF9900','columns':[col('review_id','INTEGER','PK'),col('product_id','INTEGER','FK'),col('customer_id','INTEGER','FK'),col('rating','INTEGER'),col('review_date','TEXT')],'rows':reviews},
 {'name':'warehouses','color':'#FF9900','columns':[col('warehouse_id','INTEGER','PK'),col('warehouse_name','TEXT'),col('location','TEXT'),col('capacity','INTEGER')],'rows':warehouses},
 {'name':'employees','color':'#FF9900','columns':[col('employee_id','INTEGER','PK'),col('first_name','TEXT'),col('last_name','TEXT'),col('department','TEXT'),col('salary','INTEGER'),col('warehouse_id','INTEGER','FK')],'rows':employees},
]
company={'key':'amazon','name':'Amazon','tagline':'E-commerce · Fulfillment · Reviews','color':'#FF9900','logo':'🛒','logoUrl':'https://cdn.simpleicons.org/amazon/FF9900'}
qs=[]
for f in sorted(os.listdir(os.path.dirname(os.path.abspath(__file__)))):
    if f.startswith('questions_') and f.endswith('.json'): qs+=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),f)))
emit(company,tables,qs)
