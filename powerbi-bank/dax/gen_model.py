"""DAX practice model: a small star schema. Sales fact + Date/Product/Customer dims. Dates as ISO strings."""
import random, datetime, json
random.seed(7)
def iso(d): return d.isoformat()
# Date dimension: every day of 2023-2024
dates=[]
d=datetime.date(2023,1,1)
while d<=datetime.date(2024,12,31):
    dates.append({"Date":iso(d),"Year":d.year,"Quarter":f"Q{(d.month-1)//3+1}","Month":d.month,"MonthName":d.strftime("%b"),"Day":d.day,"Weekday":d.strftime("%a")})
    d+=datetime.timedelta(days=1)
products=[
    {"ProductKey":1,"Product":"Laptop","Category":"Electronics","Cost":600,"Price":999},
    {"ProductKey":2,"Product":"Phone","Category":"Electronics","Cost":300,"Price":699},
    {"ProductKey":3,"Product":"Headphones","Category":"Electronics","Cost":40,"Price":149},
    {"ProductKey":4,"Product":"Desk","Category":"Furniture","Cost":120,"Price":299},
    {"ProductKey":5,"Product":"Chair","Category":"Furniture","Cost":80,"Price":199},
    {"ProductKey":6,"Product":"Notebook","Category":"Stationery","Cost":2,"Price":6},
    {"ProductKey":7,"Product":"Pen Set","Category":"Stationery","Cost":3,"Price":12},
    {"ProductKey":8,"Product":"Monitor","Category":"Electronics","Cost":150,"Price":329},
]
customers=[]
regions=["North","South","East","West"]
segs=["Consumer","Corporate","SMB"]
for i in range(1,21):
    customers.append({"CustomerKey":i,"Customer":f"Cust {i}","Region":random.choice(regions),"Segment":random.choice(segs)})
sales=[]
sid=0
for _ in range(600):
    sid+=1
    dt=random.choice(dates)["Date"]
    p=random.choice(products)
    c=random.choice(customers)
    qty=random.randint(1,8)
    disc=random.choice([0,0,0,0.05,0.1,0.15])
    sales.append({"SalesKey":sid,"Date":dt,"ProductKey":p["ProductKey"],"CustomerKey":c["CustomerKey"],"Quantity":qty,"Discount":disc,"SalesAmount":round(p["Price"]*qty*(1-disc),2),"CostAmount":round(p["Cost"]*qty,2)})
model={
    "key":"sales",
    "name":"Contoso Sales (DAX)",
    "tagline":"Sales fact · Date, Product, Customer dimensions",
    "color":"#F2C811",
    "intro":"A star schema: the Sales fact table relates to Date (on Date), Product (on ProductKey) and Customer (on CustomerKey). Write a DAX measure expression — just the part after the '=' — and it is evaluated in an empty filter context unless the question says otherwise.",
    "relationships":[
        {"from":"Sales","fromKey":"Date","to":"Date","toKey":"Date"},
        {"from":"Sales","fromKey":"ProductKey","to":"Product","toKey":"ProductKey"},
        {"from":"Sales","fromKey":"CustomerKey","to":"Customer","toKey":"CustomerKey"},
    ],
    "tables":{"Sales":sales,"Date":dates,"Product":products,"Customer":customers},
}
json.dump(model,open("model.json","w"))
print("sales",len(sales),"dates",len(dates),"products",len(products),"customers",len(customers))
