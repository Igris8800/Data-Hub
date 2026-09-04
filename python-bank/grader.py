# Canonical serialisation of a `result` value, shared by the build-time validator (CPython) and the browser (Pyodide).
def canon(v):
    import math
    try:
        import pandas as pd, numpy as np
    except Exception:  # pragma: no cover
        pd = np = None
    def norm(x):
        if pd is not None and isinstance(x, pd.Timestamp): return x.isoformat()
        if np is not None and isinstance(x, np.bool_): return bool(x)
        if np is not None and isinstance(x, np.integer): return int(x)
        if isinstance(x, bool): return x
        if isinstance(x, int): return x
        if isinstance(x, float) or (np is not None and isinstance(x, np.floating)):
            f = float(x); return None if math.isnan(f) else round(f, 6)
        if isinstance(x, (list, tuple)) or (np is not None and isinstance(x, np.ndarray)): return [norm(i) for i in list(x)]
        if isinstance(x, (set, frozenset)): return sorted([norm(i) for i in x], key=lambda z: str(z))
        if isinstance(x, dict): return {str(k): norm(val) for k, val in x.items()}
        if x is None or isinstance(x, str): return x
        return str(x)
    if pd is not None and isinstance(v, pd.DataFrame):
        d = v if isinstance(v.index, pd.RangeIndex) else v.reset_index()
        return {"kind": "df", "columns": [str(c) for c in d.columns], "rows": [[norm(x) for x in r] for r in d.itertuples(index=False, name=None)]}
    if pd is not None and isinstance(v, pd.Series):
        return {"kind": "series", "name": str(v.name) if v.name is not None else None, "index": [norm(i) for i in v.index.tolist()], "values": [norm(x) for x in v.tolist()]}
    return {"kind": "scalar", "value": norm(v)}
