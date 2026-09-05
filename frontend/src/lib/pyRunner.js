/**
 * pyRunner.js — runs learner Python in the browser via Pyodide (CPython compiled to WebAssembly) with pandas/numpy.
 * One Pyodide instance is shared for the session; each run gets a fresh namespace with the dataset DataFrames preloaded.
 */
import { PYTHON_PRELUDE, PYTHON_GRADER } from "@/lib/pythonTrack";

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("Could not load Python runtime")); document.head.appendChild(s);
  });
}

/** Boot Pyodide + pandas once. onStatus receives progress strings. */
export function getPyodide(onStatus) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatus?.("Downloading Python runtime…");
    await loadScript(PYODIDE_URL + "pyodide.js");
    const py = await window.loadPyodide({ indexURL: PYODIDE_URL });
    onStatus?.("Loading pandas and numpy…");
    await py.loadPackage(["pandas", "numpy"]);
    py.runPython(PYTHON_GRADER);
    py.runPython(`
import io, json, sys, traceback, contextlib
_DATASETS = {}
def _load_dataset(key, frames_json):
    import pandas as pd
    frames = {}
    for name, csv_text in json.loads(frames_json).items():
        df = pd.read_csv(io.StringIO(csv_text))
        for c in df.columns:
            if c.endswith('_date') or c in ('order_date','signup_date','review_date','month','watch_date','start_date','hire_date','exit_date','date','ts'):
                df[c] = pd.to_datetime(df[c], errors='coerce')
        frames[name] = df
    _DATASETS[key] = frames
def _run(key, code):
    g = {'__name__': '__main__'}
    exec(${JSON.stringify(PYTHON_PRELUDE)}, g)
    for k, v in _DATASETS.get(key, {}).items():
        g[k] = v.copy()
    out = io.StringIO(); err = None
    with contextlib.redirect_stdout(out):
        try:
            exec(code, g)
        except Exception:
            err = traceback.format_exc(limit=3)
    res = None; repr_text = None
    if err is None and 'result' in g:
        try:
            res = canon(g['result'])
            r = g['result']
            repr_text = r.to_string(max_rows=60) if hasattr(r, 'to_string') else repr(r)
        except Exception:
            err = traceback.format_exc(limit=2)
    return json.dumps({'stdout': out.getvalue()[-8000:], 'error': err, 'result': res, 'repr': repr_text[:8000] if repr_text else None, 'has_result': 'result' in g})
`);
    onStatus?.("Ready");
    return py;
  })();
  pyodidePromise.catch(() => { pyodidePromise = null; });
  return pyodidePromise;
}

const loadedDatasets = new Set();
export async function ensureDataset(py, dataset, onStatus) {
  if (loadedDatasets.has(dataset.key)) return;
  if (dataset.needs_scipy && !loadedDatasets.has("__scipy__")) {
    onStatus?.("Loading scipy…");
    await py.loadPackage(["scipy"]);
    py.runPython("import scipy.stats as stats");
    loadedDatasets.add("__scipy__");
  }
  py.globals.get("_load_dataset")(dataset.key, JSON.stringify(dataset.frames));
  loadedDatasets.add(dataset.key);
}

/** Execute code; returns {stdout, error, result (canonical), repr, has_result}. */
export async function runPython(py, datasetKey, code) {
  const out = py.globals.get("_run")(datasetKey, code);
  return JSON.parse(out);
}

// ---------- grading (mirrors python-bank/grader.py canonical form) ----------
const norm = (v) => (typeof v === "number" ? Math.round(v * 1e6) / 1e6 : v === null || v === undefined ? null : typeof v === "object" ? JSON.stringify(v) : String(v));
const keyRow = (r) => r.map(norm).join("\u001f");
const sameMultiset = (a, b) => { if (a.length !== b.length) return false; const A = [...a].sort(), B = [...b].sort(); return A.every((x, i) => x === B[i]); };

export function resultsMatch(got, exp, orderMatters) {
  if (!got || !exp) return { ok: false, why: "No result to compare." };
  if (got.kind !== exp.kind) {
    // allow a 1-column DataFrame vs Series and list vs Series
    if (exp.kind === "series" && got.kind === "scalar" && Array.isArray(got.value)) return resultsMatch({ kind: "series", index: got.value.map((_, i) => i), values: got.value }, exp, orderMatters);
    if (exp.kind === "series" && got.kind === "df" && got.columns.length <= 2) return resultsMatch({ kind: "series", index: got.rows.map((r) => r[0]), values: got.rows.map((r) => r[r.length - 1]) }, exp, orderMatters);
    if (exp.kind === "scalar" && got.kind === "series" && Array.isArray(exp.value)) return resultsMatch({ kind: "scalar", value: got.values }, exp, orderMatters);
    return { ok: false, why: `Expected a ${exp.kind === "df" ? "DataFrame" : exp.kind === "series" ? "Series" : "single value / list"}, got a ${got.kind === "df" ? "DataFrame" : got.kind === "series" ? "Series" : "single value / list"}.` };
  }
  if (exp.kind === "scalar") {
    const a = Array.isArray(got.value) ? got.value.map(norm) : [norm(got.value)], b = Array.isArray(exp.value) ? exp.value.map(norm) : [norm(exp.value)];
    if (Array.isArray(exp.value) !== Array.isArray(got.value)) return { ok: false, why: Array.isArray(exp.value) ? "Expected a list/tuple." : "Expected a single value, not a list." };
    const ok = orderMatters || !Array.isArray(exp.value) ? a.length === b.length && a.every((x, i) => x === b[i]) : sameMultiset(a, b);
    return ok ? { ok: true } : { ok: false, why: Array.isArray(exp.value) ? `Expected ${b.length} item(s); values differ.` : `Expected ${JSON.stringify(exp.value)}, got ${JSON.stringify(got.value)}.` };
  }
  if (exp.kind === "series") {
    if (got.values.length !== exp.values.length) return { ok: false, why: `Expected ${exp.values.length} value(s), got ${got.values.length}.` };
    const positional = exp.index.every((i) => Number.isInteger(i)) && exp.index.every((v, i) => i === 0 || v > exp.index[i - 1]);
    const pairs = (s) => s.values.map((v, i) => (positional ? norm(v) : norm(s.index[i]) + "=" + norm(v)));
    const ok = orderMatters ? pairs(got).every((x, i) => x === pairs(exp)[i]) : sameMultiset(pairs(got), pairs(exp));
    return ok ? { ok: true } : { ok: false, why: positional ? "Right length, but values differ." : "Right length, but index labels or values differ." };
  }
  // DataFrame: same set of columns (order-insensitive), rows compared in the reference column order
  const gcols = got.columns.filter((c) => c !== "index"), ecols = exp.columns.filter((c) => c !== "index");
  if (!sameMultiset(gcols, ecols)) return { ok: false, why: `Expected columns [${ecols.join(", ")}], got [${gcols.join(", ")}].` };
  if (got.rows.length !== exp.rows.length) return { ok: false, why: `Expected ${exp.rows.length} row(s), got ${got.rows.length}.` };
  const pos = ecols.map((c) => got.columns.indexOf(c)); const epos = ecols.map((c) => exp.columns.indexOf(c));
  const g = got.rows.map((r) => keyRow(pos.map((p) => r[p]))), e = exp.rows.map((r) => keyRow(epos.map((p) => r[p])));
  const ok = orderMatters ? g.every((x, i) => x === e[i]) : sameMultiset(g, e);
  return ok ? { ok: true } : { ok: false, why: orderMatters ? "Rows differ (order matters for this task)." : "Same shape, but some values differ — check filters, rounding and types." };
}
