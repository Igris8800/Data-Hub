"""Generates the 'Sales Ledger' workbook used by the Excel track. Dates are stored as Excel serials."""
import random, datetime, json
random.seed(11)
def serial(y,m,d): return (datetime.date(y,m,d)-datetime.date(1899,12,30)).days
reps=[["Ana Silva","North",42000,serial(2021,3,15)],["Ben Carter","South",38000,serial(2019,7,1)],["Chloe Wang","East",45000,serial(2022,1,10)],["Dev Patel","West",40000,serial(2020,11,23)],["Eva Rossi","North",36000,serial(2023,5,2)],["Farid Khan","South",44000,serial(2018,9,17)]]
products=[["Widget","Hardware",18.5],["Gadget","Hardware",42.0],["Doohickey","Hardware",9.75],["Cable Pack","Accessories",4.2],["Dock","Accessories",27.0],["Sensor","Electronics",63.0],["Controller","Electronics",88.0],["Service Plan","Services",0.0]]
price={"Widget":29.99,"Gadget":69.5,"Doohickey":14.99,"Cable Pack":8.99,"Dock":49.0,"Sensor":99.0,"Controller":149.0,"Service Plan":120.0}
orders=[]
for i in range(1,41):
    d=datetime.date(2024,1,1)+datetime.timedelta(days=random.randint(0,364))
    rep=random.choice(reps); p=random.choice(products)
    units=random.randint(1,12); st=random.choice(["Delivered"]*7+["Cancelled","Returned","Pending"])
    orders.append([1000+i,(d-datetime.date(1899,12,30)).days,rep[1],rep[0],p[0],units,price[p[0]],st])
# a few messy cells for data-cleaning questions
orders[4][3]="  ana silva "; orders[11][3]="BEN CARTER"; orders[22][2]="north"
wb={"key":"sales","name":"Sales Ledger","tagline":"Orders · Products · Reps","color":"#00FF88",
 "tables":[
  {"name":"Orders","anchor":"A1","headers":["OrderID","Date","Region","Rep","Product","Units","UnitPrice","Status"],"types":["n","date","s","s","s","n","money","s"],"rows":orders},
  {"name":"Products","anchor":"J1","headers":["Product","Category","Cost"],"types":["s","s","money"],"rows":products},
  {"name":"Reps","anchor":"N1","headers":["Rep","Region","Target","HireDate"],"types":["s","s","money","date"],"rows":reps}],
 "answerCell":"A44"}
json.dump(wb,open('workbook_sales.json','w'),indent=0)
print("orders",len(orders),"first date serial",orders[0][1])
