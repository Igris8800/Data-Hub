"""Inventory & Supply: Stock A1:I41 (40 SKUs), Movements K1:O81 (80 rows), Suppliers Q1:T7, Reorder rules V1:W4."""
import random, datetime, json
random.seed(23)
def serial(d): return (d-datetime.date(1899,12,30)).days
sups=[["SUP1","Nordic Supply","Sweden",14,0.98],["SUP2","Shenzhen Traders","China",28,0.91],["SUP3","Mumbai Textiles","India",7,0.95],["SUP4","EuroHome GmbH","Germany",18,0.97],["SUP5","Pacific Imports","Japan",21,0.93],["SUP6","Brasil Naturals","Brazil",30,0.88]]
cats=['Hardware','Accessories','Electronics','Consumables','Packaging']
skus=[]
for i in range(1,41):
    cat=random.choice(cats); sup=random.choice(sups)[0]
    cost=round(random.uniform(2,180),2); onhand=random.choice([0,0,4,12,25,40,60,90,150,240])
    reorder=random.choice([10,20,30,50]); daily=round(random.uniform(0.2,6),1)
    skus.append([f"SKU{i:03d}",f"Item {i}",cat,sup,cost,onhand,reorder,daily,random.choice(['A','A','B','B','B','C','C'])])
# messy: negative stock, zero daily demand
skus[6][5]=-3; skus[13][7]=0
moves=[]
for _ in range(80):
    s=random.choice(skus); d=datetime.date(2025,1,1)+datetime.timedelta(days=random.randint(0,200))
    typ=random.choice(['IN','OUT','OUT','OUT','ADJ'])
    qty=random.randint(5,120) if typ=='IN' else random.randint(1,40) if typ=='OUT' else random.randint(-5,5)
    moves.append([serial(d),s[0],typ,qty,random.choice(['WH-A','WH-B'])])
moves[12][1]='SKU099'                                  # orphan SKU (not in Stock)
moves[40][0]=serial(datetime.date(2026,1,15))            # future-dated row
moves.sort(key=lambda r:r[0])
rules=[["Safety days",7],["Service target",0.95],["Order multiple",10]]
wb={"key":"inventory","name":"Inventory & Supply","tagline":"Stock · Movements · Suppliers · Reorder rules","color":"#F58549",
 "tables":[
  {"name":"Stock","anchor":"A1","headers":["SKU","Item","Category","SupplierID","UnitCost","OnHand","ReorderPoint","DailyDemand","ABC"],"types":["s","s","s","s","money","n","n","n","s"],"rows":skus},
  {"name":"Movements","anchor":"K1","headers":["Date","SKU","Type","Qty","Warehouse"],"types":["date","s","s","n","s"],"rows":moves},
  {"name":"Suppliers","anchor":"Q1","headers":["SupplierID","Name","Country","LeadDays","OnTimeRate"],"types":["s","s","s","n","n"],"rows":sups},
  {"name":"Rules","anchor":"W1","headers":["Rule","Value"],"types":["s","n"],"rows":rules}],
 "answerCell":"A45"}
json.dump(wb,open('workbook.json','w'),indent=0); print(len(skus),'skus',len(moves),'movements')
