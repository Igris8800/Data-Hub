"""Field Research Lab dataset: observational + experimental tables for nonparametric,
effect-size, resampling and Bayesian practice.
 - plots:    agronomy trial — fertilizer (Alpha/Beta/Gamma) x region, rainfall, yield (ANOVA, Kruskal, Mann-Whitney, effect sizes, OLS with a numeric covariate)
 - training: paired pre/post skill scores per trainee (Wilcoxon signed-rank, paired t, sign test)
 - poll:     categorical survey region x candidate (chi-square independence, GOF, Cramer's V, residuals)
 - bivar:    two numeric columns with a monotone, mildly non-linear relation + one outlier (Pearson vs Spearman vs Kendall, regression)
 - ab:       a two-variant conversion experiment (proportions, Wilson interval, Bayesian Beta-Binomial)
Note: the 'yield' column is referenced as plots['yield'] (never as an attribute) because yield is a Python keyword.
"""
import random, csv, io, json, os
random.seed(2027)
here = os.path.dirname(os.path.abspath(__file__))

def clip(v, lo, hi): return max(lo, min(hi, v))

# --- plots: 60 plots, 20 per fertilizer, balanced across two regions ---
FERT_BASE = {"Alpha": 42.0, "Beta": 50.0, "Gamma": 58.0}
plots = []
pid = 1
for fert, base in FERT_BASE.items():
    for k in range(20):
        region = "North" if k % 2 == 0 else "South"
        rainfall = round(clip(random.gauss(40, 8), 20, 60), 1)
        region_effect = 2.0 if region == "North" else -2.0
        y = base + 0.6 * (rainfall - 40) + region_effect + random.gauss(0, 5)
        plots.append({"plot_id": pid, "fertilizer": fert, "region": region,
                      "rainfall": rainfall, "yield": round(clip(y, 5, None if False else 200), 2)})
        pid += 1
random.shuffle(plots)
plots = [{**r, "plot_id": i + 1} for i, r in enumerate(plots)]

# --- training: 30 trainees, post = pre + improvement + noise ---
training = []
for i in range(30):
    pre = round(clip(random.gauss(62, 9), 30, 95), 1)
    post = round(clip(pre + random.gauss(5, 4), 30, 100), 1)
    training.append({"trainee": i + 1, "pre": pre, "post": post})

# --- poll: 240 voters, candidate preference depends on region (real association) ---
REGION_PREFS = {
    "East":  [("X", 0.55), ("Y", 0.30), ("Z", 0.15)],
    "West":  [("X", 0.25), ("Y", 0.50), ("Z", 0.25)],
    "North": [("X", 0.35), ("Y", 0.25), ("Z", 0.40)],
    "South": [("X", 0.30), ("Y", 0.40), ("Z", 0.30)],
}
def pick(prefs):
    r = random.random(); acc = 0.0
    for cand, p in prefs:
        acc += p
        if r <= acc: return cand
    return prefs[-1][0]
poll = []
regions = list(REGION_PREFS)
for i in range(240):
    region = regions[i % 4]
    poll.append({"voter_id": i + 1, "region": region, "candidate": pick(REGION_PREFS[region])})

# --- bivar: 40 units, monotone mildly non-linear relation, one deliberate outlier ---
bivar = []
for i in range(40):
    x = round(random.uniform(1, 10), 2)
    y = 3 + 1.4 * x + 0.25 * x * x + random.gauss(0, 3)
    bivar.append({"unit": i + 1, "x": x, "y": round(y, 2)})
bivar[0]["y"] = round(bivar[0]["y"] + 35, 2)  # outlier to separate Pearson from Spearman/Kendall

# --- ab: two-variant conversion experiment (aggregate counts) ---
def conv(n, p): return sum(1 for _ in range(n) if random.random() < p)
a_n, b_n = 800, 800
a_c, b_c = conv(a_n, 0.10), conv(b_n, 0.13)
ab = [{"variant": "A", "visitors": a_n, "conversions": a_c},
      {"variant": "B", "visitors": b_n, "conversions": b_c}]

def csvstr(rows):
    buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow(r)
    return buf.getvalue()

ds = {
    "key": "stats3",
    "name": "Field Research Lab (scipy)",
    "tagline": "plots · training · poll · bivar · ab",
    "color": "#06D6A0",
    "needs_scipy": True,
    "intro": ("Five DataFrames: plots (fertilizer, region, rainfall, yield), training (pre/post per trainee), "
              "poll (region, candidate), bivar (x, y), ab (variant, visitors, conversions). "
              "pandas is pd, numpy is np, scipy.stats is stats. Reference the yield column as plots['yield']. "
              "Assign your answer to result."),
    "frames": {
        "plots": csvstr(plots),
        "training": csvstr(training),
        "poll": csvstr(poll),
        "bivar": csvstr(bivar),
        "ab": csvstr(ab),
    },
}
json.dump(ds, open(os.path.join(here, "dataset.json"), "w"))
print({k: v.count(chr(10)) - 1 for k, v in ds["frames"].items()}, "a_c", a_c, "b_c", b_c)
