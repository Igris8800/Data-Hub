"""IoT sensor dataset: readings (hourly time-series per device), devices, alerts, maintenance."""
import random, datetime, csv, io, json, os, math
random.seed(505)
here=os.path.dirname(os.path.abspath(__file__))
sites=['Plant-A','Plant-B','Warehouse','Cold-Store']
devices=[]
for i in range(1,13):
    devices.append({'device_id':i,'name':f"SEN-{i:03d}",'site':random.choice(sites),
        'kind':('temperature' if i==1 else random.choice(['temperature','humidity','pressure','vibration'])),
        'installed':(datetime.date(2024,1,1)+datetime.timedelta(days=random.randint(0,300))).isoformat()})
# hourly readings for 21 days across all devices
start=datetime.datetime(2025,6,1,0,0,0)
hours=21*24
base={'temperature':22,'humidity':55,'pressure':101.3,'vibration':0.5}
amp={'temperature':4,'humidity':10,'pressure':0.4,'vibration':0.3}
readings=[]; rid=0
for dev in devices:
    if dev['device_id']==12: continue  # offline device (no-readings question)
    b=base[dev['kind']]; a=amp[dev['kind']]
    for h in range(hours):
        ts=start+datetime.timedelta(hours=h)
        # daily sinusoid + noise
        val=b + a*math.sin(2*math.pi*(ts.hour)/24) + random.gauss(0, a*0.15)
        # inject a gap (some readings missing) ~4% of the time
        if random.random()<0.04:
            continue
        rid+=1
        readings.append({'reading_id':rid,'device_id':dev['device_id'],'ts':ts.strftime('%Y-%m-%d %H:%M:%S'),
            'value':round(val,3),'battery':round(max(0,100-h*0.15+random.gauss(0,1)),1)})
# inject spikes/anomalies for device 1 and 5
for r in readings:
    if r['device_id']==1 and r['ts'].endswith('12:00:00') and r['ts'][8:10] in ('05','10','15'):
        r['value']=round(r['value']+25,3)  # temperature spikes
    if r['device_id']==5 and r['ts'][8:10]=='08':
        r['value']=round(r['value']-15,3)
# a few missing values (sensor glitch, present row but null value)
for r in random.sample(readings,15): r['value']=None
# threshold config per kind
thresholds=[{'kind':'temperature','low':15,'high':30},{'kind':'humidity','low':30,'high':70},
            {'kind':'pressure','low':100.5,'high':102.0},{'kind':'vibration','low':0.0,'high':1.2}]
# maintenance windows
maint=[]
for i in range(6):
    d=random.choice(devices)
    day=datetime.datetime(2025,6,random.randint(2,20),random.randint(0,23),0,0)
    maint.append({'maint_id':i+1,'device_id':d['device_id'],'ts':day.strftime('%Y-%m-%d %H:%M:%S'),
        'action':random.choice(['calibration','battery swap','cleaning','firmware'])})
def csvstr(rows):
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow({k:('' if v is None else v) for k,v in r.items()})
    return buf.getvalue()
ds={"key":"sensors","name":"IoT Sensors (pandas)","tagline":"readings · devices · thresholds · maintenance",
    "color":"#118AB2",
    "intro":"Four DataFrames are preloaded: readings (device_id, ts, value, battery), devices, thresholds (per kind), maintenance. ts is a datetime. pandas is pd, numpy is np. Assign your answer to result.",
    "frames":{"readings":csvstr(readings),"devices":csvstr(devices),"thresholds":csvstr(thresholds),"maintenance":csvstr(maint)}}
json.dump(ds,open(os.path.join(here,'dataset.json'),'w'))
print({k:v.count(chr(10))-1 for k,v in ds['frames'].items()})
