"""Marketing Campaigns: Weekly A1:I79 (6 channels × 13 weeks), Channels K1:N7 (targets), Campaigns P1:T9."""
import random, datetime, json
random.seed(29)
def serial(d): return (d-datetime.date(1899,12,30)).days
channels=[["Google Search",1.8,0.04,35],["Meta",1.2,0.025,40],["LinkedIn",4.5,0.02,120],["Email",0.1,0.06,8],["YouTube",0.9,0.012,60],["Affiliate",0.6,0.05,25]]  # name, target CPC, target CVR, target CPA
weeks=[datetime.date(2025,4,7)+datetime.timedelta(days=7*i) for i in range(13)]
rows=[]
for ch in channels:
    for w in weeks:
        spend=round(random.uniform(800,6000),2); imps=int(spend/ch[1]*random.uniform(30,60))
        clicks=int(imps*random.uniform(0.008,0.05)); conv=int(clicks*ch[2]*random.uniform(0.6,1.5)); rev=round(conv*random.uniform(60,220),2)
        rows.append([serial(w),ch[0],spend,imps,clicks,conv,rev,random.choice(['Brand','Performance','Performance','Retargeting'])])
# messy: a zero-click week, an inconsistent channel name
rows[20][4]=0; rows[20][5]=0; rows[20][6]=0.0; rows[33][1]="meta"
ch_rows=[[c[0],c[1],c[2],c[3]] for c in channels]
camps=[["CAMP01","Spring Sale","Google Search",serial(datetime.date(2025,4,7)),serial(datetime.date(2025,5,4)),15000],["CAMP02","Brand Awareness","YouTube",serial(datetime.date(2025,4,14)),serial(datetime.date(2025,6,29)),20000],["CAMP03","Webinar Push","LinkedIn",serial(datetime.date(2025,5,5)),serial(datetime.date(2025,5,25)),9000],["CAMP04","Cart Recovery","Email",serial(datetime.date(2025,4,7)),serial(datetime.date(2025,7,6)),1200],["CAMP05","Summer Launch","Meta",serial(datetime.date(2025,6,2)),serial(datetime.date(2025,7,6)),18000],["CAMP06","Partner Promo","Affiliate",serial(datetime.date(2025,4,21)),serial(datetime.date(2025,6,15)),6000],["CAMP07","Retargeting Q2","Meta",serial(datetime.date(2025,4,7)),serial(datetime.date(2025,6,29)),7500],["CAMP08","Search Always-On","Google Search",serial(datetime.date(2025,4,7)),serial(datetime.date(2025,7,6)),30000]]
for c in camps:  # budget ≈ channel spend inside the window × 0.8–1.3 (a few over budget, most under)
    sp=sum(r[2] for r in rows if r[1].lower()==c[2].lower() and c[3]<=r[0]<=c[4])
    c[5]=int(round(sp*random.choice([0.85,0.9,1.05,1.1,1.2,1.3])/100)*100)
wb={"key":"marketing","name":"Marketing Campaigns","tagline":"Weekly channel data · Targets · Campaigns","color":"#FFD166",
 "tables":[
  {"name":"Weekly","anchor":"A1","headers":["WeekStart","Channel","Spend","Impressions","Clicks","Conversions","Revenue","Objective"],"types":["date","s","money","n","n","n","money","s"],"rows":rows},
  {"name":"Channels","anchor":"K1","headers":["Channel","TargetCPC","TargetCVR","TargetCPA"],"types":["s","money","n","money"],"rows":ch_rows},
  {"name":"Campaigns","anchor":"P1","headers":["CampaignID","Name","Channel","StartDate","EndDate","Budget"],"types":["s","s","s","date","date","money"],"rows":camps}],
 "answerCell":"A83"}
json.dump(wb,open('workbook.json','w'),indent=0); print(len(rows),'weekly rows')
