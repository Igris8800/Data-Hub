"""HR & Payroll workbook: Employees A1:I51, Leave K1:N61, Grades P1:S6, Holidays U1:U9. Dates are Excel serials."""
import random, datetime, json
random.seed(17)
def serial(d): return (d-datetime.date(1899,12,30)).days
depts=['Engineering','Sales','Finance','People','Operations','Marketing']
locs=['Bengaluru','Mumbai','Pune','Remote']
grades={'G1':(30000,45000,5),'G2':(45000,70000,8),'G3':(70000,110000,10),'G4':(110000,160000,12),'G5':(160000,250000,15)}
first=['Aarav','Priya','Rohan','Sneha','Vikram','Ananya','Karan','Meera','Arjun','Divya','Rahul','Isha','Nikhil','Pooja','Siddharth','Kavya','Aditya','Neha','Varun','Riya','Manish','Tanvi','Dev','Shreya','Yash','Sara','Ishaan','Myra','Kabir','Anika','Reyansh','Saanvi','Vihaan','Diya','Advait','Kiara','Atharv','Navya','Rudra','Pari','Zara','Aryan','Nitya','Om','Ira','Kian','Tara','Veer','Mira','Jay']
last=['Sharma','Patel','Reddy','Iyer','Nair','Gupta','Mehta','Singh','Rao','Joshi','Kulkarni','Desai','Bose','Menon','Verma','Shah','Pillai','Das']
emps=[]
for i in range(1,51):
    g=random.choice(['G1','G2','G2','G3','G3','G3','G4','G5']); lo,hi,bonus=grades[g]
    hd=datetime.date(2015,1,1)+datetime.timedelta(days=random.randint(0,3800))
    sal=round(random.uniform(lo,hi)/500)*500
    status='Active' if random.random()<0.85 else 'Resigned'
    emps.append([1000+i,f"{first[i-1]} {random.choice(last)}",random.choice(depts),g,serial(hd),sal,bonus,random.choice(locs),status])
# a few out-of-band salaries and messy text
emps[4][5]=grades[emps[4][3]][0]-4000; emps[11][5]=grades[emps[11][3]][1]+9000
emps[7][1]="  "+emps[7][1].lower()+" "; emps[19][2]="sales"
leave=[]
for _ in range(60):
    e=random.choice(emps); st=datetime.date(2025,1,1)+datetime.timedelta(days=random.randint(0,200))
    leave.append([e[0],random.choice(['Casual','Casual','Sick','Earned','Earned','Unpaid']),serial(st),random.choice([1,1,2,2,3,5,7,10])])
leave.sort(key=lambda r:r[2])
grade_rows=[[g,lo,hi,b] for g,(lo,hi,b) in grades.items()]
holidays=[serial(datetime.date(2025,m,d)) for m,d in [(1,1),(1,26),(3,14),(4,18),(5,1),(8,15),(10,2),(10,20)]]
wb={"key":"hr","name":"HR & Payroll","tagline":"Employees · Leave · Grades · Holidays","color":"#B892FF",
 "tables":[
  {"name":"Employees","anchor":"A1","headers":["EmpID","Name","Dept","Grade","HireDate","Salary","BonusPct","Location","Status"],"types":["n","s","s","s","date","money","n","s","s"],"rows":emps},
  {"name":"Leave","anchor":"K1","headers":["EmpID","LeaveType","StartDate","Days"],"types":["n","s","date","n"],"rows":leave},
  {"name":"Grades","anchor":"P1","headers":["Grade","MinSalary","MaxSalary","BonusPct"],"types":["s","money","money","n"],"rows":grade_rows},
  {"name":"Holidays","anchor":"U1","headers":["Holiday"],"types":["date"],"rows":[[h] for h in holidays]}],
 "answerCell":"A55"}
json.dump(wb,open('workbook.json','w'),indent=0)
print(len(emps),'employees',len(leave),'leave rows')
