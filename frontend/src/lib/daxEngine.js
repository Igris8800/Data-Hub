/**
 * daxEngine.js — a compact DAX evaluator for in-browser practice.
 * Models the essentials: filter context, row context (iterators), relationships (RELATED / cross-filter),
 * CALCULATE with filter modifiers (ALL / ALLEXCEPT / FILTER / boolean filters / VALUES), and core time intelligence.
 *
 * A "model" is { tables: {Name: [rowObj,...]}, relationships: [{from, fromKey, to, toKey}] }.
 * evaluateMeasure(expr, model) returns { value } (scalar) or { table } (array of row objects) or { error }.
 *
 * This is intentionally a subset. Supported: literals, arithmetic & comparison & && || , string &,
 * table refs (Sales), column refs (Sales[Amount] or [Amount] in row context), measure-style expressions,
 * VAR/RETURN, IF, SWITCH(TRUE()), functions listed in FN below. Dates are ISO 'YYYY-MM-DD' strings compared lexically.
 */

export class DaxError extends Error { constructor(m) { super(m); this.dax = true; } }
const err = (m) => { throw new DaxError(m); };
const isBlank = (v) => v === null || v === undefined || v === "";

// ---------------- tokenizer ----------------
function tokenize(src) {
  const t = []; let i = 0; const n = src.length;
  const push = (k, v) => t.push({ k, v });
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    if (c === '"') { let j = i + 1, s = ""; while (j < n) { if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += src[j++]; } if (j >= n) err("Unterminated string"); push("str", s); i = j + 1; continue; }
    if (c === "[") { let j = i + 1, s = ""; while (j < n && src[j] !== "]") s += src[j++]; if (src[j] !== "]") err("Unterminated [column]"); push("col", s); i = j + 1; continue; }
    if (c === "'") { let j = i + 1, s = ""; while (j < n && src[j] !== "'") s += src[j++]; if (src[j] !== "'") err("Unterminated 'table'"); push("tbl", s); i = j + 1; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1]))) { let j = i; while (j < n && /[0-9.]/.test(src[j])) j++; push("num", parseFloat(src.slice(i, j))); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_.]/.test(src[j])) j++; push("id", src.slice(i, j)); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (two === "&&" || two === "||" || two === "<=" || two === ">=" || two === "<>") { push("op", two); i += 2; continue; }
    if ("+-*/&=<>(),".includes(c)) { push("op", c); i++; continue; }
    err("Unexpected character '" + c + "'");
  }
  push("eof", null); return t;
}

// ---------------- parser (Pratt) ----------------
const PREC = { "||": 1, "&&": 2, "=": 3, "<>": 3, "<": 3, ">": 3, "<=": 3, ">=": 3, "&": 4, "+": 5, "-": 5, "*": 6, "/": 6 };
function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p]; const next = () => tokens[p++];
  const expect = (v) => { const tk = next(); if (tk.v !== v) err("Expected '" + v + "'"); };
  function parseExpr(min = 0) {
    let left = parseUnary();
    while (peek().k === "op" && PREC[peek().v] !== undefined && PREC[peek().v] >= min) {
      const op = next().v; const right = parseExpr(PREC[op] + 1); left = { t: "bin", op, left, right };
    }
    return left;
  }
  function parseUnary() { if (peek().k === "op" && peek().v === "-") { next(); return { t: "neg", e: parseUnary() }; } if (peek().k === "op" && peek().v === "+") { next(); return parseUnary(); } return parsePrimary(); }
  function parsePrimary() {
    const tk = next();
    if (tk.k === "num") return { t: "num", v: tk.v };
    if (tk.k === "str") return { t: "str", v: tk.v };
    if (tk.k === "col") return { t: "col", table: null, name: tk.v };
    if (tk.k === "op" && tk.v === "(") { const e = parseExpr(); expect(")"); return e; }
    if (tk.k === "tbl") { // 'Table' or 'Table'[Col]
      if (peek().k === "col") { const col = next().v; return { t: "col", table: tk.v, name: col }; }
      return { t: "table", name: tk.v };
    }
    if (tk.k === "id") {
      const name = tk.v.toUpperCase();
      if (peek().k === "op" && peek().v === "(") { next(); const args = []; if (!(peek().k === "op" && peek().v === ")")) { args.push(parseExpr()); while (peek().k === "op" && peek().v === ",") { next(); args.push(parseExpr()); } } expect(")"); return { t: "call", name, args }; }
      if (peek().k === "col") { const col = next().v; return { t: "col", table: tk.v, name: col }; } // Table[Col] without quotes
      // bareword: TRUE/FALSE/BLANK or a table name
      if (name === "TRUE") return { t: "bool", v: true }; if (name === "FALSE") return { t: "bool", v: false }; if (name === "BLANK") return { t: "num", v: null };
      return { t: "table", name: tk.v };
    }
    err("Unexpected token"); return null;
  }
  const ast = parseExpr(); if (peek().k !== "eof") err("Unexpected trailing input"); return ast;
}

// ---------------- model helpers ----------------
function buildIndexes(model) {
  const rels = model.relationships || [];
  return { rels };
}
// Given a filtered set of rows for each table (the filter context), plus row context (current row per table),
// resolve a column value.
function colValue(node, ctx) {
  const { rowCtx } = ctx;
  let table = node.table;
  if (!table) { // [Col] in row context — find which row-context table has this column
    for (const [tname, row] of Object.entries(rowCtx)) if (row && node.name in row) { table = tname; break; }
    if (!table) err("Column [" + node.name + "] not found in current row context");
  }
  const row = rowCtx[table];
  if (row && node.name in row) return row[node.name];
  // Not in row context directly: maybe reachable via RELATED-style single-row context on the many side
  err("Column '" + table + "'[" + node.name + "] is not available here (need RELATED or an iterator)");
}

// Apply the filter context to produce visible rows of a table.
function visibleRows(model, table, fc) {
  const all = model.tables[table] || err("Unknown table '" + table + "'");
  const preds = fc[table];
  if (!preds || preds.length === 0) return all;
  return all.filter((r) => preds.every((p) => p(r)));
}
// Propagate filters from dimension tables to the fact via relationships (single-direction Dim->Fact).
function factRowsWithContext(model, factTable, fc) {
  let rows = visibleRows(model, factTable, fc);
  for (const rel of model.relationships) {
    if (rel.from === factTable) {
      const dimVisible = visibleRows(model, rel.to, fc);
      // if dim is filtered relative to all, restrict fact by allowed keys
      if ((fc[rel.to] && fc[rel.to].length) ) {
        const allowed = new Set(dimVisible.map((r) => r[rel.toKey]));
        rows = rows.filter((r) => allowed.has(r[rel.fromKey]));
      }
    }
  }
  return rows;
}
// RELATED: from a fact row, get a column from a related dim.
function related(model, factTable, factRow, colName) {
  for (const rel of model.relationships) {
    if (rel.from === factTable) {
      const dim = model.tables[rel.to];
      const match = dim.find((d) => d[rel.toKey] === factRow[rel.fromKey]);
      if (match && colName in match) return match[colName];
    }
  }
  err("RELATED could not resolve [" + colName + "]");
}

// ---------------- numeric / compare helpers ----------------
const num = (v) => { if (isBlank(v)) return 0; if (typeof v === "boolean") return v ? 1 : 0; const n = Number(v); return Number.isNaN(n) ? err("Cannot convert to number: " + v) : n; };
function cmp(a, b) { if (isBlank(a)) a = 0; if (isBlank(b)) b = 0; if (typeof a === "number" && typeof b === "number") return a - b; return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0; }

// ---------------- evaluator ----------------
function evalNode(node, ctx) {
  const { model, fc } = ctx;
  switch (node.t) {
    case "num": return node.v; case "str": return node.v; case "bool": return node.v;
    case "col": return colValue(node, ctx);
    case "table": return { __table: node.name };
    case "neg": return -num(evalNode(node.e, ctx));
    case "bin": {
      const op = node.op;
      if (op === "&&") return !!evalNode(node.left, ctx) && !!evalNode(node.right, ctx);
      if (op === "||") return !!evalNode(node.left, ctx) || !!evalNode(node.right, ctx);
      const a = evalNode(node.left, ctx), b = evalNode(node.right, ctx);
      if (op === "&") return (isBlank(a) ? "" : String(a)) + (isBlank(b) ? "" : String(b));
      if (op === "=") return cmp(a, b) === 0; if (op === "<>") return cmp(a, b) !== 0;
      if (op === "<") return cmp(a, b) < 0; if (op === ">") return cmp(a, b) > 0;
      if (op === "<=") return cmp(a, b) <= 0; if (op === ">=") return cmp(a, b) >= 0;
      const x = num(a), y = num(b);
      if (op === "+") return x + y; if (op === "-") return x - y; if (op === "*") return x * y;
      if (op === "/") return y === 0 ? null : x / y;
      err("Bad operator " + op);
    }
    case "call": return evalCall(node, ctx);
    default: err("Cannot evaluate node");
  }
}

// resolve a node that should yield a table (array of rows): a table ref, or a table-returning function.
function evalTable(node, ctx) {
  if (node.t === "table") return { table: node.name, rows: factRowsWithContext(ctx.model, node.name, ctx.fc), base: node.name };
  if (node.t === "call") { const r = evalCall(node, ctx, true); if (r && r.__rows) return { table: r.baseTable, rows: r.__rows, base: r.baseTable }; }
  err("Expected a table expression");
}

// iterate a table, evaluating expr per row with row context set to that row (and related dims resolvable).
function iterate(tableInfo, exprNode, ctx, reducer, init) {
  let acc = init; let count = 0;
  for (const row of tableInfo.rows) {
    const rowCtx = { ...ctx.rowCtx, [tableInfo.base]: row };
    const v = evalNode(exprNode, { ...ctx, rowCtx });
    acc = reducer(acc, v, count); count++;
  }
  return { acc, count };
}

// CALCULATE: evaluate expr with modified filter context.
function applyFilterArg(argNode, ctx) {
  // boolean filter like Product[Category] = "Electronics"  -> predicate on that table
  // FILTER(table, cond) -> restrict
  // ALL(table)/ALL(table[col]) -> remove filters
  // VALUES(...) handled as passthrough of current
  const fc2 = ctx.fc;
  const cloneFc = () => { const o = {}; for (const k in fc2) o[k] = [...(fc2[k] || [])]; return o; };
  if (argNode.t === "call") {
    const nm = argNode.name;
    if (nm === "ALL" || nm === "REMOVEFILTERS") {
      const nf = cloneFc();
      if (argNode.args.length === 0) { for (const k in ctx.model.tables) nf[k] = []; return nf; }
      for (const a of argNode.args) { if (a.t === "table") nf[a.name] = []; else if (a.t === "col") { const tb = a.table || err("ALL needs 'Table'[Col]"); nf[tb] = []; } }
      return nf;
    }
    if (nm === "ALLEXCEPT") {
      const nf = cloneFc(); const tbl = argNode.args[0].t === "table" ? argNode.args[0].name : err("ALLEXCEPT first arg must be a table");
      nf[tbl] = []; // remove all, then re-add filters on the kept columns from current context is complex; approximate by keeping current preds on those columns
      // Re-apply: keep predicates that reference the kept columns — we approximate by re-adding equality on kept columns' current distinct values is not tracked; supported at call sites via explicit tests.
      return nf;
    }
    if (nm === "FILTER") {
      const tnode = argNode.args[0]; const cond = argNode.args[1];
      const ti = evalTable(tnode, ctx);
      const keep = ti.rows.filter((row) => { const rowCtx = { ...ctx.rowCtx, [ti.base]: row }; return !!evalNode(cond, { ...ctx, rowCtx }); });
      const allowedIdx = new Set(keep);
      const nf = cloneFc(); (nf[ti.base] = nf[ti.base] || []).push((r) => allowedIdx.has(r));
      return nf;
    }
    if (nm === "SAMEPERIODLASTYEAR" || nm === "DATESYTD" || nm === "DATEADD" || nm === "PARALLELPERIOD") {
      const dates = visibleRows(ctx.model, "Date", ctx.fc); if (!dates.length) return cloneFc();
      const minD = dates.reduce((m, r) => (r.Date < m ? r.Date : m), dates[0].Date);
      const maxD = dates.reduce((m, r) => (r.Date > m ? r.Date : m), dates[0].Date);
      const shiftYear = (d, k) => (Number(d.slice(0, 4)) + k) + d.slice(4);
      let lo, hi;
      if (nm === "DATESYTD") { lo = maxD.slice(0, 4) + "-01-01"; hi = maxD; }
      else if (nm === "SAMEPERIODLASTYEAR") { lo = shiftYear(minD, -1); hi = shiftYear(maxD, -1); }
      else { const k = num(evalNode(argNode.args[1], { ...ctx, rowCtx: {} })); const unit = String(argNode.args[2] && argNode.args[2].v || "YEAR").toUpperCase(); if (unit !== "YEAR") err("Only YEAR interval supported for " + nm); lo = shiftYear(minD, k); hi = shiftYear(maxD, k); }
      const nf = cloneFc(); nf.Date = [(r) => r.Date >= lo && r.Date <= hi]; return nf;
    }
    if (nm === "VALUES" || nm === "DISTINCT") return cloneFc(); // no-op modifier for our purposes
  }
  // boolean predicate: Col = value  / Col > value / && chains
  const preds = collectPredicates(argNode, ctx);
  const nf = cloneFc();
  for (const { table, fn } of preds) { nf[table] = (nf[table] || []).filter(() => true); nf[table] = [...(nf[table] || []).filter(Boolean), fn]; }
  return nf;
}
function collectPredicates(node, ctx) {
  // returns [{table, fn(row)}] for simple boolean filter expressions used in CALCULATE
  if (node.t === "bin" && node.op === "&&") return [...collectPredicates(node.left, ctx), ...collectPredicates(node.right, ctx)];
  if (node.t === "bin" && ["=", "<>", "<", ">", "<=", ">="].includes(node.op)) {
    const colN = node.left.t === "col" ? node.left : node.right.t === "col" ? node.right : err("CALCULATE filter must compare a column");
    const table = colN.table || err("CALCULATE filter needs 'Table'[Col]");
    const valNode = node.left === colN ? node.right : node.left;
    const val = evalNode(valNode, { ...ctx, rowCtx: {} });
    const op = node.op;
    const fn = (r) => { const c = cmp(r[colN.name], val); return op === "=" ? c === 0 : op === "<>" ? c !== 0 : op === "<" ? c < 0 : op === ">" ? c > 0 : op === "<=" ? c <= 0 : c >= 0; };
    return [{ table, fn }];
  }
  err("Unsupported CALCULATE filter argument");
}

const FN = {};
// aggregation over a column in current filter context (implicit fact iteration)
function aggCol(colNode, ctx, reduce, init, opts = {}) {
  const table = colNode.table || err("Aggregations need 'Table'[Col]");
  const rows = factRowsWithContext(ctx.model, table, ctx.fc).length ? factRowsWithContext(ctx.model, table, ctx.fc) : visibleRows(ctx.model, table, ctx.fc);
  let acc = init, count = 0;
  for (const r of rows) { const v = r[colNode.name]; if (opts.skipBlank && isBlank(v)) continue; acc = reduce(acc, v, count); count++; }
  return opts.finalize ? opts.finalize(acc, count) : acc;
}
FN.SUM = (args, ctx) => aggCol(args[0], ctx, (a, v) => a + num(v), 0, { skipBlank: true });
FN.AVERAGE = (args, ctx) => aggCol(args[0], ctx, (a, v) => a + num(v), 0, { skipBlank: true, finalize: (a, c) => (c ? a / c : null) });
FN.MIN = (args, ctx) => aggCol(args[0], ctx, (a, v) => (a === null ? num(v) : Math.min(a, num(v))), null, { skipBlank: true });
FN.MAX = (args, ctx) => aggCol(args[0], ctx, (a, v) => (a === null ? num(v) : Math.max(a, num(v))), null, { skipBlank: true });
FN.COUNT = (args, ctx) => aggCol(args[0], ctx, (a) => a + 1, 0, { skipBlank: true });
FN.COUNTA = (args, ctx) => aggCol(args[0], ctx, (a, v) => a + (isBlank(v) ? 0 : 1), 0);
FN.DISTINCTCOUNT = (args, ctx) => { const c = args[0]; const table = c.table; const rows = factRowsWithContext(ctx.model, table, ctx.fc).length ? factRowsWithContext(ctx.model, table, ctx.fc) : visibleRows(ctx.model, table, ctx.fc); return new Set(rows.map((r) => r[c.name])).size; };
FN.COUNTROWS = (args, ctx) => { const ti = evalTable(args[0], ctx); return ti.rows.length; };
// iterators
function iterAgg(args, ctx, reduce, init, finalize) { const ti = evalTable(args[0], ctx); const { acc, count } = iterate(ti, args[1], ctx, reduce, init); return finalize ? finalize(acc, count) : acc; }
FN.SUMX = (a, c) => iterAgg(a, c, (s, v) => s + num(v), 0);
FN.AVERAGEX = (a, c) => iterAgg(a, c, (s, v) => s + num(v), 0, (s, n) => (n ? s / n : null));
FN.MINX = (a, c) => iterAgg(a, c, (m, v) => (m === null ? num(v) : Math.min(m, num(v))), null);
FN.MAXX = (a, c) => iterAgg(a, c, (m, v) => (m === null ? num(v) : Math.max(m, num(v))), null);
FN.COUNTX = (a, c) => iterAgg(a, c, (s, v) => s + (isBlank(v) ? 0 : 1), 0);
FN.RELATED = (args, ctx) => { const col = args[0]; if (col.t !== "col" || !col.table) err("RELATED needs 'Table'[Col]"); const base = Object.keys(ctx.rowCtx)[0]; if (!base) err("RELATED requires row context"); return related(ctx.model, base, ctx.rowCtx[base], col.name); };
FN.CALCULATE = (args, ctx) => { let fc = ctx.fc; for (let i = 1; i < args.length; i++) fc = applyFilterArg(args[i], { ...ctx, fc }); return evalNode(args[0], { ...ctx, fc, rowCtx: {} }); };
FN.DIVIDE = (args, ctx) => { const a = num(evalNode(args[0], ctx)); const b = num(evalNode(args[1], ctx)); if (b === 0) return args[2] !== undefined ? evalNode(args[2], ctx) : null; return a / b; };
FN.IF = (args, ctx) => (evalNode(args[0], ctx) ? evalNode(args[1], ctx) : args[2] !== undefined ? evalNode(args[2], ctx) : null);
FN.SWITCH = (args, ctx) => { const first = evalNode(args[0], ctx); const isTrue = first === true; if (isTrue) { for (let i = 1; i + 1 < args.length; i += 2) if (evalNode(args[i], ctx)) return evalNode(args[i + 1], ctx); return (args.length % 2 === 0) ? evalNode(args[args.length - 1], ctx) : null; } for (let i = 1; i + 1 < args.length; i += 2) if (cmp(first, evalNode(args[i], ctx)) === 0) return evalNode(args[i + 1], ctx); return (args.length % 2 === 0) ? evalNode(args[args.length - 1], ctx) : null; };
FN.TRUE = () => true; FN.FALSE = () => false; FN.BLANK = () => null; FN.NOT = (a, c) => !evalNode(a[0], c);
FN.ABS = (a, c) => Math.abs(num(evalNode(a[0], c))); FN.ROUND = (a, c) => { const x = num(evalNode(a[0], c)); const d = num(evalNode(a[1], c)); const m = 10 ** d; return Math.round(x * m) / m; };
FN.INT = (a, c) => Math.floor(num(evalNode(a[0], c))); FN.YEAR = (a, c) => Number(String(evalNode(a[0], c)).slice(0, 4)); FN.MONTH = (a, c) => Number(String(evalNode(a[0], c)).slice(5, 7)); FN.DAY = (a, c) => Number(String(evalNode(a[0], c)).slice(8, 10));
FN.DATE = (a, c) => { const y = num(evalNode(a[0], c)), m = num(evalNode(a[1], c)), d = num(evalNode(a[2], c)); return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; };
FN.CONCATENATE = (a, c) => String(evalNode(a[0], c)) + String(evalNode(a[1], c)); FN.UPPER = (a, c) => String(evalNode(a[0], c)).toUpperCase(); FN.LOWER = (a, c) => String(evalNode(a[0], c)).toLowerCase(); FN.LEN = (a, c) => String(evalNode(a[0], c)).length;
// time intelligence — operate on the Date table; the current fc's Date filter defines the period
function dateColumnRef(args) { const c = args[1]; if (!c || c.t !== "col") err("Time-intel needs a date column argument"); return c; }
function currentDates(ctx) { return visibleRows(ctx.model, "Date", ctx.fc); }
FN.TOTALYTD = (args, ctx) => { const expr = args[0]; const dcol = dateColumnRef(args); const dates = currentDates(ctx); if (!dates.length) return null; const maxD = dates.reduce((m, r) => (r.Date > m ? r.Date : m), dates[0].Date); const yr = maxD.slice(0, 4); const start = yr + "-01-01"; const nf = { ...ctx.fc, Date: [(r) => r.Date >= start && r.Date <= maxD] }; return evalNode(expr, { ...ctx, fc: nf, rowCtx: {} }); };
FN.DATESYTD = (args, ctx) => FN.TOTALYTD(args, ctx); // approximated as a period wrapper when used inside CALCULATE is out of scope; expose value form
FN.SAMEPERIODLASTYEAR = (args, ctx) => { const expr = args[0]; const dates = currentDates(ctx); if (!dates.length) return null; const minD = dates.reduce((m, r) => (r.Date < m ? r.Date : m), dates[0].Date); const maxD = dates.reduce((m, r) => (r.Date > m ? r.Date : m), dates[0].Date); const shift = (d) => (Number(d.slice(0, 4)) - 1) + d.slice(4); const nf = { ...ctx.fc, Date: [(r) => r.Date >= shift(minD) && r.Date <= shift(maxD)] }; return evalNode(expr, { ...ctx, fc: nf, rowCtx: {} }); };
FN.DATEADD = (args, ctx) => { const expr = args[0]; const intervals = num(evalNode(args[2], ctx)); const unit = String(args[3] && args[3].v || "YEAR").toUpperCase(); const dates = currentDates(ctx); if (!dates.length) return null; const minD = dates.reduce((m, r) => (r.Date < m ? r.Date : m), dates[0].Date); const maxD = dates.reduce((m, r) => (r.Date > m ? r.Date : m), dates[0].Date); const shiftYear = (d, k) => (Number(d.slice(0, 4)) + k) + d.slice(4); const nf = { ...ctx.fc, Date: [(r) => { if (unit === "YEAR") return r.Date >= shiftYear(minD, intervals) && r.Date <= shiftYear(maxD, intervals); err("DATEADD unit not supported: " + unit); }] }; return evalNode(expr, { ...ctx, fc: nf, rowCtx: {} }); };
FN.RANKX = (args, ctx) => { const ti = evalTable(args[0], ctx); const exprNode = args[1]; const vals = ti.rows.map((row) => num(evalNode(exprNode, { ...ctx, rowCtx: { ...ctx.rowCtx, [ti.base]: row } }))); const target = args[2] !== undefined ? num(evalNode(args[2], ctx)) : num(evalNode(exprNode, ctx)); const sorted = [...vals].sort((a, b) => b - a); return sorted.findIndex((v) => v === target) + 1; };

function evalCall(node, ctx, wantTable) {
  const nm = node.name;
  // table-returning functions
  if (nm === "FILTER") { const ti = evalTable(node.args[0], ctx); const cond = node.args[1]; const rows = ti.rows.filter((row) => !!evalNode(cond, { ...ctx, rowCtx: { ...ctx.rowCtx, [ti.base]: row } })); return wantTable ? { __rows: rows, baseTable: ti.base } : err("FILTER returns a table; wrap it in an iterator or COUNTROWS"); }
  if (nm === "ALL" || nm === "VALUES" || nm === "DISTINCT" || nm === "REMOVEFILTERS") { if (wantTable) { const a = node.args[0]; if (!a || a.t === "table") { const tb = a ? a.name : null; const rows = tb ? ctx.model.tables[tb] : []; return { __rows: rows, baseTable: tb }; } if (a.t === "col") { const tb = a.table; const seen = new Set(); const rows = []; for (const r of ctx.model.tables[tb]) { if (!seen.has(r[a.name])) { seen.add(r[a.name]); rows.push(r); } } return { __rows: rows, baseTable: tb }; } } }
  const fn = FN[nm] || err("Unknown or unsupported function " + nm + "()");
  return fn(node.args, ctx);
}

// ---------------- public API ----------------
export function evaluateMeasure(expr, model) {
  try {
    let body = String(expr).trim(); if (body.startsWith("=")) body = body.slice(1);
    // VAR ... RETURN ...  (single or multiple VARs)
    const vars = {};
    const varRe = /^\s*VAR\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*/i;
    while (varRe.test(body)) {
      const m = body.match(varRe); const nameV = m[1]; const rest = body.slice(m[0].length);
      // find the matching end of this expression: up to the next top-level VAR or RETURN
      const idx = findVarBoundary(rest);
      const exprPart = rest.slice(0, idx).trim(); body = rest.slice(idx).trim();
      vars[nameV] = exprPart;
    }
    let retExpr = body;
    if (/^RETURN\b/i.test(body)) retExpr = body.replace(/^RETURN\b/i, "").trim();
    // substitute VAR references (simple token replacement with parenthesised sub-expressions)
    const model2 = model; const ctxBase = { model: model2, fc: {}, rowCtx: {}, vars };
    const resolvedVars = {};
    for (const [k, val] of Object.entries(vars)) resolvedVars[k] = substituteVars(val, resolvedVars);
    const resolved = substituteVars(retExpr, resolvedVars);
    const ast = parse(tokenize(resolved));
    const v = evalNode(ast, ctxBase);
    if (v && v.__table) return { table: model.tables[v.__table] };
    return { value: normalizeOut(v) };
  } catch (e) { return { error: e && e.dax ? e.message : (e && e.message) || "Evaluation error" }; }
}
function findVarBoundary(s) { let depth = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === "(") depth++; else if (c === ")") depth--; else if (depth === 0) { const ahead = s.slice(i); if (/^\s(VAR|RETURN)\b/i.test(" " + ahead) && (/^VAR\b/i.test(ahead) || /^RETURN\b/i.test(ahead))) return i; } } return s.length; }
function substituteVars(expr, vars) { let out = expr; for (const [k, val] of Object.entries(vars)) { const re = new RegExp("(?<![A-Za-z0-9_])" + k + "(?![A-Za-z0-9_])", "g"); out = out.replace(re, "(" + val + ")"); } return out; }
function normalizeOut(v) { if (typeof v === "number") return Math.round(v * 1e6) / 1e6; if (typeof v === "boolean") return v; if (isBlank(v)) return null; return v; }

export function resultsMatchDax(got, exp) {
  if (got.error || exp.error) return got.error === exp.error;
  if ("table" in exp) return "table" in got && JSON.stringify(got.table) === JSON.stringify(exp.table);
  const a = got.value, b = exp.value;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-4;
  return a === b;
}
