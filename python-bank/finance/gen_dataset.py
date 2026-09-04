"""Personal-finance dataset: accounts, transactions, budgets, merchants."""
import random, datetime, csv, io, json, os
random.seed(303)
here=os.path.dirname(os.path.abspath(__file__))
cats=['Groceries','Dining','Transport','Utilities','Rent','Entertainment','Health','Shopping','Salary','Transfer']
merchants={
 'Groceries':['FreshMart','GreenGrocer','DailyNeeds'],'Dining':['CafeMocha','SpiceHouse','BurgerBarn'],
 'Transport':['MetroCard','FuelUp','RideNow'],'Utilities':['PowerCo','AquaUtil','NetLink'],
 'Rent':['Landlord'],'Entertainment':['StreamFlix','GamePass','Cinema8'],
 'Health':['PharmaPlus','CityClinic'],'Shopping':['ShopEase','StyleHub','GadgetWorld'],
 'Salary':['Employer'],'Transfer':['SelfTransfer']}
merch_rows=[]; mid=0
for c,ms in merchants.items():
    for m in ms:
        mid+=1; merch_rows.append({'merchant_id':mid,'merchant':m,'category':c})
mid+=1; merch_rows.append({'merchant_id':mid,'merchant':'ClosedStore','category':'Shopping'})  # never transacted (anti-join question)
merch_by_name={m['merchant']:m for m in merch_rows}
accounts=[{'account_id':1,'name':'Checking','type':'Checking','opened':'2023-01-01'},
          {'account_id':2,'name':'Savings','type':'Savings','opened':'2023-01-01'},
          {'account_id':3,'name':'Credit Card','type':'Credit','opened':'2023-03-01'}]
tx=[]; tid=0
start=datetime.date(2024,1,1); end=datetime.date(2025,7,31)
# salary monthly (income, positive), rent monthly (expense), plus daily-ish spends
d=start
while d<=end:
    # monthly on the 1st: salary + rent + utilities
    if d.day==1:
        tid+=1; tx.append({'tx_id':tid,'account_id':1,'date':d.isoformat(),'merchant':'Employer','category':'Salary','amount':round(random.uniform(90000,110000),2),'type':'credit'})
        tid+=1; tx.append({'tx_id':tid,'account_id':1,'date':d.isoformat(),'merchant':'Landlord','category':'Rent','amount':-25000.0,'type':'debit'})
        for u in ['PowerCo','AquaUtil','NetLink']:
            tid+=1; tx.append({'tx_id':tid,'account_id':1,'date':d.isoformat(),'merchant':u,'category':'Utilities','amount':-round(random.uniform(500,3000),2),'type':'debit'})
    # random daily spends
    for _ in range(random.randint(0,4)):
        c=random.choice(['Groceries','Dining','Transport','Entertainment','Health','Shopping'])
        m=random.choice(merchants[c])
        acct=random.choice([1,1,3])  # some on credit card
        tid+=1; tx.append({'tx_id':tid,'account_id':acct,'date':d.isoformat(),'merchant':m,'category':c,'amount':-round(random.uniform(50,4000),2),'type':'debit'})
    # occasional savings transfer
    if d.day==5:
        tid+=1; tx.append({'tx_id':tid,'account_id':2,'date':d.isoformat(),'merchant':'SelfTransfer','category':'Transfer','amount':round(random.uniform(5000,20000),2),'type':'credit'})
    d+=datetime.timedelta(days=1)
# a big anomaly + a missing amount
tid+=1; tx.append({'tx_id':tid,'account_id':3,'date':'2025-04-15','merchant':'GadgetWorld','category':'Shopping','amount':-185000.0,'type':'debit'})
# duplicate charges (billing error) — same merchant, date, amount
dup={'tx_id':None,'account_id':3,'date':'2025-02-10','merchant':'StreamFlix','category':'Entertainment','amount':-499.0,'type':'debit'}
for _ in range(2):
    tid+=1; d2=dict(dup); d2['tx_id']=tid; tx.append(d2)
tx[20]['amount']=None
budgets=[{'category':c,'monthly_budget':b} for c,b in
    [('Groceries',15000),('Dining',8000),('Transport',6000),('Utilities',6000),('Rent',25000),('Entertainment',4000),('Health',5000),('Shopping',10000)]]
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow({k:('' if v is None else v) for k,v in r.items()})
    return buf.getvalue()
ds={"key":"finance","name":"Personal Finance (pandas)","tagline":"accounts · transactions · budgets · merchants",
    "color":"#06D6A0",
    "intro":"Four DataFrames are preloaded: accounts, transactions, budgets, merchants. amount is positive for credits (income/transfers in) and negative for debits (spending). pandas is pd, numpy is np. Assign your answer to result.",
    "frames":{"accounts":csvstr(accounts),"transactions":csvstr(tx),"budgets":csvstr(budgets),"merchants":csvstr(merch_rows)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()})
