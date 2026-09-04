"""Budget vs Actuals: Ledger A1:F97 (8 depts × 12 months: Budget & Actual), Depts H1:J9 (owner, cost centre), FX K1:M13 (monthly USD rate), Assumptions O1:P5."""
import random, datetime, json
random.seed(31)
def serial(d): return (d-datetime.date(1899,12,30)).days
depts=[("Engineering","Asha K","CC100",420000),("Sales","Rohit M","CC200",310000),("Marketing","Neha S","CC210",180000),("Finance","Vikram R","CC300",95000),("People","Meera N","CC310",80000),("Operations","Karan D","CC400",150000),("Support","Divya P","CC410",70000),("IT","Arjun T","CC500",120000)]
rows=[]
for name,owner,cc,base in depts:
    for m in range(1,13):
        d=datetime.date(2025,m,1); season=1+0.08*((m-1)%4==3)  # quarter-end bumps
        budget=round(base*season/12*random.uniform(0.95,1.05)/100)*100
        actual=round(budget*random.uniform(0.82,1.18)/10)*10
        rows.append([serial(d),name,cc,budget,actual,random.choice(['Opex','Opex','Opex','Capex'])])
# messy: a missing actual, a negative actual (credit)
rows[17][4]=None; rows[50][4]=-1200
rows[70][2]='CC999'                     # cost-centre mismatch
rows[88][1]='Sales Ops'                 # orphan department (also leaves Support with 11 rows)
dept_rows=[[n,o,c] for n,o,c,_ in depts]
fx=[[serial(datetime.date(2025,m,1)),round(random.uniform(82,86),2)] for m in range(1,13)]
assumptions=[["Variance threshold",0.1],["Inflation",0.06],["Capex cap",250000],["USD budget total",120000]]
wb={"key":"finance","name":"Budget vs Actuals","tagline":"Monthly ledger · Departments · FX · Assumptions","color":"#00D4FF",
 "tables":[
  {"name":"Ledger","anchor":"A1","headers":["Month","Dept","CostCentre","Budget","Actual","Type"],"types":["date","s","s","money","money","s"],"rows":rows},
  {"name":"Depts","anchor":"H1","headers":["Dept","Owner","CostCentre"],"types":["s","s","s"],"rows":dept_rows},
  {"name":"FX","anchor":"L1","headers":["Month","INRperUSD"],"types":["date","n"],"rows":fx},
  {"name":"Assumptions","anchor":"O1","headers":["Assumption","Value"],"types":["s","n"],"rows":assumptions}],
 "answerCell":"A101"}
json.dump(wb,open('workbook.json','w'),indent=0); print(len(rows),'ledger rows')
