/**
 * excelEngine.js — a small but real Excel formula engine for in-browser practice.
 * Parses Excel syntax (cell refs, ranges, operators, functions, strings, booleans, % and & operators),
 * evaluates against a worksheet object { "A1": value, ... }, and returns scalars or 2-D arrays.
 * Dates are Excel serial numbers (days since 1899-12-30), like the real thing.
 */

// ---------- errors ----------
export class XlError extends Error { constructor(code) { super(code); this.code = code; } }
const ERR = (c) => new XlError(c);
const isErr = (v) => v instanceof XlError;

// ---------- dates ----------
const EPOCH = Date.UTC(1899, 11, 30);
export const toSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5);
export const fromSerial = (n) => new Date(EPOCH + Math.floor(n) * 864e5);
export const serialFromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return toSerial(y, m, d); };
export const serialToISO = (n) => fromSerial(n).toISOString().slice(0, 10);

// ---------- cell address helpers ----------
export function colToIndex(letters) { let n = 0; for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; }
export function indexToCol(i) { let s = ""; i += 1; while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; }
export const addr = (c, r) => `${indexToCol(c)}${r + 1}`;
function parseAddr(a) { const m = /^\$?([A-Z]{1,3})\$?(\d+)$/i.exec(a); if (!m) return null; return { c: colToIndex(m[1]), r: parseInt(m[2], 10) - 1 }; }

// ---------- tokenizer ----------
const isDigit = (ch) => ch >= "0" && ch <= "9";
const isIdent = (ch) => /[A-Za-z0-9_.$]/.test(ch);
function tokenize(src) {
  const t = []; let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\n" || ch === "\t") { i++; continue; }
    if (ch === '"') { let j = i + 1, s = ""; while (j < src.length) { if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += src[j++]; } if (j >= src.length) throw ERR("#ERROR!"); t.push({ k: "str", v: s }); i = j + 1; continue; }
    if (isDigit(ch) || (ch === "." && isDigit(src[i + 1]))) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; if (/[eE]/.test(src[j]) && /[0-9+-]/.test(src[j + 1] || "")) { j++; if (/[+-]/.test(src[j])) j++; while (isDigit(src[j] || "")) j++; } t.push({ k: "num", v: parseFloat(src.slice(i, j)) }); i = j; continue; }
    if (/[A-Za-z_$]/.test(ch)) { let j = i; while (j < src.length && isIdent(src[j])) j++; let word = src.slice(i, j); if (src[j] === "!") { j++; while (j < src.length && isIdent(src[j])) j++; word = src.slice(i, j); } t.push({ k: "id", v: word }); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (["<=", ">=", "<>"].includes(two)) { t.push({ k: "op", v: two }); i += 2; continue; }
    if ("+-*/^&=<>%(),:;{}".includes(ch)) { t.push({ k: "op", v: ch }); i++; continue; }
    throw ERR("#ERROR!");
  }
  return t;
}

// ---------- parser (precedence climbing) ----------
function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p]; const next = () => tokens[p++];
  const expectOp = (v) => { const tk = next(); if (!tk || tk.k !== "op" || tk.v !== v) throw ERR("#ERROR!"); };
  const isOp = (v) => peek() && peek().k === "op" && peek().v === v;

  function comparison() { let l = concat(); while (peek() && peek().k === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(peek().v)) { const op = next().v; const r = concat(); l = { t: "bin", op, l, r }; } return l; }
  function concat() { let l = additive(); while (isOp("&")) { next(); l = { t: "bin", op: "&", l, r: additive() }; } return l; }
  function additive() { let l = term(); while (isOp("+") || isOp("-")) { const op = next().v; l = { t: "bin", op, l, r: term() }; } return l; }
  function term() { let l = power(); while (isOp("*") || isOp("/")) { const op = next().v; l = { t: "bin", op, l, r: power() }; } return l; }
  function power() { let l = unary(); while (isOp("^")) { next(); l = { t: "bin", op: "^", l, r: unary() }; } return l; }
  function unary() { if (isOp("-")) { next(); return { t: "neg", v: unary() }; } if (isOp("+")) { next(); return unary(); } return postfix(); }
  function postfix() { let v = primary(); while (isOp("%")) { next(); v = { t: "pct", v }; } return v; }
  function primary() {
    const tk = next(); if (!tk) throw ERR("#ERROR!");
    if (tk.k === "num") return { t: "num", v: tk.v };
    if (tk.k === "str") return { t: "str", v: tk.v };
    if (tk.k === "op" && tk.v === "(") { const e = comparison(); expectOp(")"); return e; }
    if (tk.k === "op" && tk.v === "{") { // array constant
      const rows = [[]]; for (;;) { rows[rows.length - 1].push(comparison()); if (isOp(",")) { next(); continue; } if (isOp(";")) { next(); rows.push([]); continue; } break; } expectOp("}"); return { t: "arr", rows };
    }
    if (tk.k === "id") {
      const up = tk.v.toUpperCase();
      if (up === "TRUE" || up === "FALSE") return { t: "bool", v: up === "TRUE" };
      if (isOp("(")) { next(); const args = []; if (!isOp(")")) { for (;;) { if (isOp(",")) { args.push({ t: "empty" }); next(); continue; } args.push(comparison()); if (isOp(",")) { next(); if (isOp(")")) { args.push({ t: "empty" }); } continue; } break; } } expectOp(")"); return { t: "fn", name: up, args }; }
      if (isOp(":")) { next(); const r = next(); if (!r || r.k !== "id") throw ERR("#ERROR!"); const a = parseAddr(tk.v.replace(/^.*!/, "")), b = parseAddr(r.v.replace(/^.*!/, "")); if (!a || !b) throw ERR("#REF!"); return { t: "range", c1: Math.min(a.c, b.c), r1: Math.min(a.r, b.r), c2: Math.max(a.c, b.c), r2: Math.max(a.r, b.r) }; }
      const a = parseAddr(tk.v.replace(/^.*!/, "")); if (a) return { t: "ref", ...a };
      throw ERR("#NAME?");
    }
    throw ERR("#ERROR!");
  }
  const ast = comparison(); if (p < tokens.length) throw ERR("#ERROR!"); return ast;
}

// ---------- value helpers ----------
const isArr = (v) => Array.isArray(v);
const flat = (v) => (isArr(v) ? v.flat() : [v]);
function num(v) { if (isErr(v)) throw v; if (v === null || v === undefined || v === "") return 0; if (typeof v === "boolean") return v ? 1 : 0; if (typeof v === "number") return v; const n = Number(v); if (Number.isNaN(n)) throw ERR("#VALUE!"); return n; }
function str(v) { if (isErr(v)) throw v; if (v === null || v === undefined) return ""; if (typeof v === "boolean") return v ? "TRUE" : "FALSE"; return String(v); }
function bool(v) { if (isErr(v)) throw v; if (typeof v === "boolean") return v; if (typeof v === "number") return v !== 0; if (v === null || v === undefined || v === "") return false; const u = String(v).toUpperCase(); if (u === "TRUE") return true; if (u === "FALSE") return false; throw ERR("#VALUE!"); }
const numsOf = (vals) => vals.filter((v) => typeof v === "number");
function scalar(v) { if (isArr(v)) { if (v.length === 1 && v[0].length === 1) return v[0][0]; throw ERR("#VALUE!"); } return v; }
function cmp(a, b) { // Excel ordering: numbers < text < booleans; text case-insensitive
  const rank = (v) => (typeof v === "boolean" ? 2 : typeof v === "string" ? 1 : 0);
  if (a === null || a === undefined) a = 0; if (b === null || b === undefined) b = 0;
  if (typeof a === "string" && typeof b === "string") { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return a < b ? -1 : a > b ? 1 : 0;
}
function broadcast(a, b, f) {
  if (!isArr(a) && !isArr(b)) return f(a, b);
  const A = isArr(a) ? a : [[a]], B = isArr(b) ? b : [[b]];
  const R = Math.max(A.length, B.length), C = Math.max(A[0].length, B[0].length);
  const out = [];
  for (let r = 0; r < R; r++) { const row = []; for (let c = 0; c < C; c++) { const x = A[A.length === 1 ? 0 : r]?.[A[0].length === 1 ? 0 : c], y = B[B.length === 1 ? 0 : r]?.[B[0].length === 1 ? 0 : c]; if (x === undefined || y === undefined) row.push(ERR("#N/A")); else { try { row.push(f(x, y)); } catch (e) { row.push(isErr(e) ? e : ERR("#VALUE!")); } } } out.push(row); }
  return out;
}
function mapArr(v, f) { return isArr(v) ? v.map((row) => row.map((x) => { try { return f(x); } catch (e) { return isErr(e) ? e : ERR("#VALUE!"); } })) : f(v); }

// criteria for *IF functions: ">500", "<>x", "North", "*ing", 42
function criterion(c) {
  c = scalar(c);
  if (typeof c === "number" || typeof c === "boolean") return (v) => typeof v === typeof c && v === c;
  const s = str(c); const m = /^(<>|>=|<=|=|>|<)(.*)$/.exec(s);
  let op = "=", rhs = s; if (m) { op = m[1]; rhs = m[2]; }
  const n = rhs === "" ? NaN : Number(rhs);
  if (!Number.isNaN(n) && rhs.trim() !== "") return (v) => { if (typeof v !== "number") return op === "<>"; return op === "=" ? v === n : op === "<>" ? v !== n : op === ">" ? v > n : op === "<" ? v < n : op === ">=" ? v >= n : v <= n; };
  if (op === "=" || op === "<>") { const re = new RegExp("^" + rhs.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i"); const eq = (v) => (v === null || v === undefined ? rhs === "" : re.test(str(v))); return op === "=" ? eq : (v) => !eq(v); }
  return (v) => { const r = cmp(v, rhs); return op === ">" ? r > 0 : op === "<" ? r < 0 : op === ">=" ? r >= 0 : r <= 0; };
}
function ifsMask(pairs) { // [[range, crit], ...] -> boolean mask over flattened cells
  const n = flat(pairs[0][0]).length; const mask = new Array(n).fill(true);
  for (const [rng, crit] of pairs) { const cells = flat(rng); if (cells.length !== n) throw ERR("#VALUE!"); const test = criterion(crit); for (let i = 0; i < n; i++) if (mask[i] && !test(cells[i])) mask[i] = false; }
  return mask;
}
const pad = (s, n, ch = "0") => String(s).padStart(n, ch);
function fmtNumber(n, fmt) { // subset of TEXT formats
  const f = fmt.trim();
  if (/^0+(\.0+)?%$/.test(f)) { const d = (f.split(".")[1] || "").length - 1; return (n * 100).toFixed(Math.max(d, 0)) + "%"; }
  if (/^#,##0(\.0+)?$/.test(f) || /^0(\.0+)?$/.test(f)) { const d = (f.split(".")[1] || "").length; const s = n.toFixed(d); return f.startsWith("#,") ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : s; }
  if (/^[dmy\/\-\s,]+$/i.test(f)) { const d = fromSerial(n); const yyyy = d.getUTCFullYear(), mm = d.getUTCMonth() + 1, dd = d.getUTCDate(); const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; return f.replace(/yyyy/i, yyyy).replace(/yy/i, pad(yyyy % 100, 2)).replace(/mmmm/i, months[mm - 1] + "@@").replace(/mmm/i, months[mm - 1]).replace(/mm/i, pad(mm, 2)).replace(/dddd/i, days[d.getUTCDay()] + "@@").replace(/ddd/i, days[d.getUTCDay()]).replace(/dd/i, pad(dd, 2)).replace(/(?<![a-z])m(?![a-z])/i, mm).replace(/(?<![a-z])d(?![a-z])/i, dd).replace(/@@/g, ""); }
  return String(n);
}

// ---------- functions ----------
const F = {};
const agg = (fn) => (...a) => fn(numsOf(a.flatMap(flat).filter((v) => !isErr(v))));
F.SUM = agg((n) => n.reduce((s, x) => s + x, 0));
F.AVERAGE = agg((n) => { if (!n.length) throw ERR("#DIV/0!"); return n.reduce((s, x) => s + x, 0) / n.length; });
F.MAX = agg((n) => (n.length ? Math.max(...n) : 0));
F.MIN = agg((n) => (n.length ? Math.min(...n) : 0));
F.COUNT = agg((n) => n.length);
F.COUNTA = (...a) => a.flatMap(flat).filter((v) => v !== null && v !== undefined && v !== "").length;
F.COUNTBLANK = (r) => flat(r).filter((v) => v === null || v === undefined || v === "").length;
F.PRODUCT = agg((n) => n.reduce((s, x) => s * x, 1));
F.MEDIAN = agg((n) => { if (!n.length) throw ERR("#NUM!"); const s = [...n].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; });
const variance = (n, sample) => { if (n.length < (sample ? 2 : 1)) throw ERR("#DIV/0!"); const m = n.reduce((s, x) => s + x, 0) / n.length; return n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - (sample ? 1 : 0)); };
F.VAR = F["VAR.S"] = agg((n) => variance(n, true)); F.VARP = F["VAR.P"] = agg((n) => variance(n, false));
F.STDEV = F["STDEV.S"] = agg((n) => Math.sqrt(variance(n, true))); F.STDEVP = F["STDEV.P"] = agg((n) => Math.sqrt(variance(n, false)));
F.LARGE = (r, k) => { const n = numsOf(flat(r)).sort((a, b) => b - a); k = num(scalar(k)); if (k < 1 || k > n.length) throw ERR("#NUM!"); return n[k - 1]; };
F.SMALL = (r, k) => { const n = numsOf(flat(r)).sort((a, b) => a - b); k = num(scalar(k)); if (k < 1 || k > n.length) throw ERR("#NUM!"); return n[k - 1]; };
F.RANK = F["RANK.EQ"] = (v, r, order) => { v = num(scalar(v)); const n = numsOf(flat(r)); const desc = !order || !num(scalar(order)); const s = [...n].sort((a, b) => (desc ? b - a : a - b)); const i = s.indexOf(v); if (i < 0) throw ERR("#N/A"); return i + 1; };
F.PERCENTILE = F["PERCENTILE.INC"] = (r, k) => { const n = numsOf(flat(r)).sort((a, b) => a - b); k = num(scalar(k)); const pos = (n.length - 1) * k, lo = Math.floor(pos), hi = Math.ceil(pos); return n[lo] + (n[hi] - n[lo]) * (pos - lo); };
F.QUARTILE = F["QUARTILE.INC"] = (r, q) => F.PERCENTILE(r, num(scalar(q)) / 4);
F.CORREL = (x, y) => { const a = numsOf(flat(x)), b = numsOf(flat(y)); const ma = a.reduce((s, v) => s + v, 0) / a.length, mb = b.reduce((s, v) => s + v, 0) / b.length; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
F.ROUND = (v, d = 0) => { v = num(scalar(v)); d = num(scalar(d)); const m = 10 ** d; return Math.round((Math.abs(v) * m + 1e-9)) / m * Math.sign(v); };
F.ROUNDUP = (v, d = 0) => { v = num(scalar(v)); const m = 10 ** num(scalar(d)); return Math.ceil(Math.abs(v) * m - 1e-9) / m * Math.sign(v); };
F.ROUNDDOWN = (v, d = 0) => { v = num(scalar(v)); const m = 10 ** num(scalar(d)); return Math.floor(Math.abs(v) * m + 1e-9) / m * Math.sign(v); };
F.INT = (v) => Math.floor(num(scalar(v))); F.TRUNC = (v) => Math.trunc(num(scalar(v)));
F.ABS = (v) => Math.abs(num(scalar(v))); F.SQRT = (v) => { v = num(scalar(v)); if (v < 0) throw ERR("#NUM!"); return Math.sqrt(v); };
F.POWER = (a, b) => num(scalar(a)) ** num(scalar(b)); F.MOD = (a, b) => { a = num(scalar(a)); b = num(scalar(b)); if (b === 0) throw ERR("#DIV/0!"); return a - b * Math.floor(a / b); };
F.CEILING = (v, s = 1) => { s = num(scalar(s)); return Math.ceil(num(scalar(v)) / s) * s; }; F.FLOOR = (v, s = 1) => { s = num(scalar(s)); return Math.floor(num(scalar(v)) / s) * s; };
F.SUMPRODUCT = (...arrs) => { const A = arrs.map(flat); const n = A[0].length; if (A.some((x) => x.length !== n)) throw ERR("#VALUE!"); let s = 0; for (let i = 0; i < n; i++) { let p = 1; for (const x of A) { const v = x[i]; p *= typeof v === "number" ? v : typeof v === "boolean" ? +v : 0; } s += p; } return s; };
F.SUMIF = (r, c, s) => { const m = ifsMask([[r, c]]); const vals = flat(s || r); return vals.reduce((t, v, i) => t + (m[i] && typeof v === "number" ? v : 0), 0); };
F.SUMIFS = (s, ...rc) => { const pairs = []; for (let i = 0; i < rc.length; i += 2) pairs.push([rc[i], rc[i + 1]]); const m = ifsMask(pairs); return flat(s).reduce((t, v, i) => t + (m[i] && typeof v === "number" ? v : 0), 0); };
F.COUNTIF = (r, c) => ifsMask([[r, c]]).filter(Boolean).length;
F.COUNTIFS = (...rc) => { const pairs = []; for (let i = 0; i < rc.length; i += 2) pairs.push([rc[i], rc[i + 1]]); return ifsMask(pairs).filter(Boolean).length; };
F.AVERAGEIF = (r, c, s) => { const m = ifsMask([[r, c]]); const v = flat(s || r).filter((x, i) => m[i] && typeof x === "number"); if (!v.length) throw ERR("#DIV/0!"); return v.reduce((a, b) => a + b, 0) / v.length; };
F.AVERAGEIFS = (s, ...rc) => { const pairs = []; for (let i = 0; i < rc.length; i += 2) pairs.push([rc[i], rc[i + 1]]); const m = ifsMask(pairs); const v = flat(s).filter((x, i) => m[i] && typeof x === "number"); if (!v.length) throw ERR("#DIV/0!"); return v.reduce((a, b) => a + b, 0) / v.length; };
F.MAXIFS = (s, ...rc) => { const pairs = []; for (let i = 0; i < rc.length; i += 2) pairs.push([rc[i], rc[i + 1]]); const m = ifsMask(pairs); const v = flat(s).filter((x, i) => m[i] && typeof x === "number"); return v.length ? Math.max(...v) : 0; };
F.MINIFS = (s, ...rc) => { const pairs = []; for (let i = 0; i < rc.length; i += 2) pairs.push([rc[i], rc[i + 1]]); const m = ifsMask(pairs); const v = flat(s).filter((x, i) => m[i] && typeof x === "number"); return v.length ? Math.min(...v) : 0; };
// logic
F.IF = (c, a, b = false) => { if (isArr(c) && !(c.length === 1 && c[0].length === 1)) { const pick = (v, r, i) => (isArr(v) ? v[v.length === 1 ? 0 : r]?.[v[0].length === 1 ? 0 : i] : v); return c.map((row, r) => row.map((x, i) => { if (isErr(x)) return x; try { return bool(x) ? pick(a, r, i) : pick(b, r, i); } catch (e) { return isErr(e) ? e : ERR("#VALUE!"); } })); } c = scalar(c); if (isErr(c)) throw c; return bool(c) ? a : b; };
F.IFS = (...a) => { for (let i = 0; i < a.length; i += 2) if (bool(scalar(a[i]))) return a[i + 1]; throw ERR("#N/A"); };
F.AND = (...a) => a.flatMap(flat).filter((v) => v !== null && v !== "").every((v) => bool(v));
F.OR = (...a) => a.flatMap(flat).filter((v) => v !== null && v !== "").some((v) => bool(v));
F.NOT = (v) => !bool(scalar(v)); F.TRUE = () => true; F.FALSE = () => false;
F.IFERROR = (v, alt) => (isErr(v) || (isArr(v) && flat(v).some(isErr)) ? alt : v);
F.IFNA = (v, alt) => (isErr(v) && v.code === "#N/A" ? alt : v);
F.ISBLANK = (v) => { v = scalar(v); return v === null || v === undefined || v === ""; };
F.ISNUMBER = (v) => typeof scalar(v) === "number"; F.ISTEXT = (v) => typeof scalar(v) === "string"; F.ISERROR = (v) => isErr(scalar(v)); F.ISEVEN = (v) => num(scalar(v)) % 2 === 0; F.ISODD = (v) => num(scalar(v)) % 2 !== 0;
F.N = (v) => { v = scalar(v); return typeof v === "number" ? v : typeof v === "boolean" ? +v : 0; };
F.CHOOSE = (i, ...a) => { i = num(scalar(i)); if (i < 1 || i > a.length) throw ERR("#VALUE!"); return a[i - 1]; };
// lookup
const asRows = (v) => (isArr(v) ? v : [[v]]);
F.VLOOKUP = (key, tbl, col, exact = true) => { key = scalar(key); const rows = asRows(tbl); col = num(scalar(col)); if (col < 1 || col > rows[0].length) throw ERR("#REF!"); const approx = !bool(scalar(exact)) === false ? false : true; void approx; const ex = bool(scalar(exact)) === false; if (ex) { const r = rows.find((row) => cmp(row[0], key) === 0); if (!r) throw ERR("#N/A"); return r[col - 1]; } let best = null; for (const row of rows) { if (cmp(row[0], key) <= 0) best = row; else break; } if (!best) throw ERR("#N/A"); return best[col - 1]; };
F.HLOOKUP = (key, tbl, rowN, exact = true) => { key = scalar(key); const rows = asRows(tbl); rowN = num(scalar(rowN)); const ex = bool(scalar(exact)) === false; const idx = ex ? rows[0].findIndex((v) => cmp(v, key) === 0) : (() => { let b = -1; rows[0].forEach((v, i) => { if (cmp(v, key) <= 0) b = i; }); return b; })(); if (idx < 0) throw ERR("#N/A"); return rows[rowN - 1][idx]; };
F.MATCH = (key, r, type = 1) => { key = scalar(key); const v = flat(r); type = num(scalar(type)); if (type === 0) { const t = typeof key === "string" ? criterion(key) : (x) => cmp(x, key) === 0; const i = v.findIndex(t); if (i < 0) throw ERR("#N/A"); return i + 1; } let b = -1; v.forEach((x, i) => { if ((type > 0 ? cmp(x, key) <= 0 : cmp(x, key) >= 0)) b = i; }); if (b < 0) throw ERR("#N/A"); return b + 1; };
F.INDEX = (r, row, col) => { const rows = asRows(r); row = row === undefined || row === null ? 0 : num(scalar(row)); col = col === undefined || col === null ? 0 : num(scalar(col)); if (rows.length === 1 && col === 0 && row > 0) { col = row; row = 1; } if (rows[0].length === 1 && col === 0) col = 1; if (row === 0) return rows.map((x) => [x[col - 1]]); if (col === 0) return [rows[row - 1]]; const v = rows[row - 1]?.[col - 1]; if (v === undefined) throw ERR("#REF!"); return v; };
F.XLOOKUP = (key, lr, rr, notFound, mode = 0) => { key = scalar(key); const l = flat(lr), rows = asRows(rr); const isCol = rows[0].length === 1 || rows.length === l.length; let i = -1; const m = num(scalar(mode)); if (m === 0) i = l.findIndex((x) => cmp(x, key) === 0); else if (m === -1) { let b = -1; l.forEach((x, j) => { if (cmp(x, key) <= 0 && (b < 0 || cmp(x, l[b]) >= 0)) b = j; }); i = b; } else if (m === 1) { let b = -1; l.forEach((x, j) => { if (cmp(x, key) >= 0 && (b < 0 || cmp(x, l[b]) <= 0)) b = j; }); i = b; } else if (m === 2) { i = l.findIndex(criterion(key)); } if (i < 0) { if (notFound !== undefined && notFound !== null && notFound !== "") return notFound; throw ERR("#N/A"); } if (isCol) { const row = rows[i]; return row.length === 1 ? row[0] : [row]; } return rows.map((r) => [r[i]]); };
F.ROW = (r) => (r && r.__ref ? r.__ref.r1 + 1 : 1); F.COLUMN = (r) => (r && r.__ref ? r.__ref.c1 + 1 : 1);
F.ROWS = (r) => asRows(r).length; F.COLUMNS = (r) => asRows(r)[0].length;
F.TRANSPOSE = (r) => { const rows = asRows(r); return rows[0].map((_, c) => rows.map((row) => row[c])); };
// dynamic arrays
F.UNIQUE = (r) => { const rows = asRows(r); const seen = new Set(); const out = []; for (const row of rows) { const k = JSON.stringify(row.map((v) => (typeof v === "string" ? v.toLowerCase() : v))); if (!seen.has(k)) { seen.add(k); out.push(row); } } return out; };
F.FILTER = (r, inc, empty) => { const rows = asRows(r), m = flat(inc); const out = rows.filter((_, i) => bool(m[i])); if (!out.length) { if (empty !== undefined) return empty; throw ERR("#CALC!"); } return out; };
F.SORT = (r, idx = 1, order = 1) => { const rows = asRows(r); idx = num(scalar(idx)) - 1; order = num(scalar(order)); return [...rows].sort((a, b) => cmp(a[idx], b[idx]) * order); };
F.SORTBY = (r, by, order = 1) => { const rows = asRows(r), k = flat(by); order = num(scalar(order)); return rows.map((row, i) => [row, k[i]]).sort((a, b) => cmp(a[1], b[1]) * order).map((x) => x[0]); };
F.SEQUENCE = (rows, cols = 1, start = 1, step = 1) => { rows = num(scalar(rows)); cols = num(scalar(cols)); start = num(scalar(start)); step = num(scalar(step)); const out = []; let v = start; for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) { row.push(v); v += step; } out.push(row); } return out; };
// text
F.LEN = (v) => str(scalar(v)).length; F.UPPER = (v) => str(scalar(v)).toUpperCase(); F.LOWER = (v) => str(scalar(v)).toLowerCase();
F.PROPER = (v) => str(scalar(v)).toLowerCase().replace(/(^|[^a-z0-9])([a-z])/g, (m, p, c) => p + c.toUpperCase());
F.TRIM = (v) => str(scalar(v)).trim().replace(/\s+/g, " ");
F.LEFT = (v, n = 1) => str(scalar(v)).slice(0, num(scalar(n))); F.RIGHT = (v, n = 1) => { const s = str(scalar(v)); n = num(scalar(n)); return n ? s.slice(-n) : ""; };
F.MID = (v, s, n) => str(scalar(v)).substr(num(scalar(s)) - 1, num(scalar(n)));
F.CONCAT = F.CONCATENATE = (...a) => a.flatMap(flat).map(str).join("");
F.TEXTJOIN = (d, ignore, ...a) => a.flatMap(flat).filter((v) => !(bool(scalar(ignore)) && (v === null || v === ""))).map(str).join(str(scalar(d)));
F.SUBSTITUTE = (t, o, n, inst) => { t = str(scalar(t)); o = str(scalar(o)); n = str(scalar(n)); if (inst === undefined) return t.split(o).join(n); let k = num(scalar(inst)), i = -1; while (k-- > 0) { i = t.indexOf(o, i + 1); if (i < 0) return t; } return t.slice(0, i) + n + t.slice(i + o.length); };
F.REPLACE = (t, s, n, nt) => { t = str(scalar(t)); s = num(scalar(s)); n = num(scalar(n)); return t.slice(0, s - 1) + str(scalar(nt)) + t.slice(s - 1 + n); };
F.FIND = (f, t, s = 1) => { const i = str(scalar(t)).indexOf(str(scalar(f)), num(scalar(s)) - 1); if (i < 0) throw ERR("#VALUE!"); return i + 1; };
F.SEARCH = (f, t, s = 1) => { const i = str(scalar(t)).toLowerCase().indexOf(str(scalar(f)).toLowerCase(), num(scalar(s)) - 1); if (i < 0) throw ERR("#VALUE!"); return i + 1; };
F.REPT = (t, n) => str(scalar(t)).repeat(Math.max(0, num(scalar(n)))); F.EXACT = (a, b) => broadcast(a, b, (x, y) => str(x) === str(y));
F.VALUE = (v) => num(scalar(v)); F.TEXT = (v, f) => fmtNumber(num(scalar(v)), str(scalar(f)));
F.TEXTBEFORE = (t, d) => { t = str(scalar(t)); const i = t.indexOf(str(scalar(d))); if (i < 0) throw ERR("#N/A"); return t.slice(0, i); };
F.TEXTAFTER = (t, d) => { t = str(scalar(t)); d = str(scalar(d)); const i = t.indexOf(d); if (i < 0) throw ERR("#N/A"); return t.slice(i + d.length); };
F.CHAR = (n) => String.fromCharCode(num(scalar(n))); F.CODE = (t) => str(scalar(t)).charCodeAt(0);
// dates (serials)
F.DATE = (y, m, d) => { const one = (Y, M, D) => Math.round((Date.UTC(num(Y), num(M) - 1, num(D)) - EPOCH) / 864e5); if (isArr(y) || isArr(m) || isArr(d)) return broadcast(broadcast(y, m, (Y, M) => [Y, M]), d, (ym, D) => one(ym[0], ym[1], D)); return one(scalar(y), scalar(m), scalar(d)); };
F.YEAR = (v) => fromSerial(num(scalar(v))).getUTCFullYear(); F.MONTH = (v) => fromSerial(num(scalar(v))).getUTCMonth() + 1; F.DAY = (v) => fromSerial(num(scalar(v))).getUTCDate();
F.WEEKDAY = (v, t = 1) => { const d = fromSerial(num(scalar(v))).getUTCDay(); t = num(scalar(t)); return t === 2 ? (d === 0 ? 7 : d) : t === 3 ? (d === 0 ? 6 : d - 1) : d + 1; };
F.TODAY = () => toSerial(2025, 7, 31); // fixed "today" so answers are deterministic
F.EDATE = (v, m) => { const d = fromSerial(num(scalar(v))); m = num(scalar(m)); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(d.getUTCDate(), last)); return Math.round((t - EPOCH) / 864e5); };
F.EOMONTH = (v, m) => { const d = fromSerial(num(scalar(v))); m = num(scalar(m)); return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m + 1, 0) - EPOCH) / 864e5); };
F.DAYS = (a, b) => num(scalar(a)) - num(scalar(b));
F.DATEDIF = (a, b, u) => { const A = fromSerial(num(scalar(a))), B = fromSerial(num(scalar(b))); u = str(scalar(u)).toUpperCase(); if (u === "D") return Math.floor((B - A) / 864e5); let months = (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + (B.getUTCMonth() - A.getUTCMonth()); if (B.getUTCDate() < A.getUTCDate()) months--; if (u === "M") return months; if (u === "Y") return Math.floor(months / 12); throw ERR("#NUM!"); };
F.NETWORKDAYS = (a, b, hol) => { let s = num(scalar(a)), e = num(scalar(b)), n = 0; const H = new Set(hol ? flat(hol).filter((x) => typeof x === "number").map(Math.floor) : []); for (let d = s; d <= e; d++) { const w = fromSerial(d).getUTCDay(); if (w !== 0 && w !== 6 && !H.has(d)) n++; } return n; };
F.WORKDAY = (a, days, hol) => { let d = num(scalar(a)); let left = num(scalar(days)); const H = new Set(hol ? flat(hol).filter((x) => typeof x === "number").map(Math.floor) : []); const step = left < 0 ? -1 : 1; left = Math.abs(left); while (left > 0) { d += step; const w = fromSerial(d).getUTCDay(); if (w !== 0 && w !== 6 && !H.has(d)) left--; } return d; };
F.SWITCH = (v, ...a) => { v = scalar(v); for (let i = 0; i + 1 < a.length; i += 2) if (cmp(v, scalar(a[i])) === 0) return a[i + 1]; if (a.length % 2 === 1) return a[a.length - 1]; throw ERR("#N/A"); };
F.YEARFRAC = (a, b) => (num(scalar(b)) - num(scalar(a))) / 365;
F.DATEVALUE = (t) => serialFromISO(str(scalar(t)));

// array-aware lifting: single-argument scalar functions map over arrays (YEAR(B2:B41) inside SUMPRODUCT etc.)
for (const name of ["NOT","YEAR","MONTH","DAY","WEEKDAY","TRIM","LOWER","UPPER","PROPER","LEN","ISNUMBER","ISTEXT","ISBLANK","ABS","INT","TRUNC","SQRT","N","VALUE","EOMONTH","EDATE","LEFT","RIGHT","ROUND","ROUNDUP","ROUNDDOWN","TEXT"]) {
  const f = F[name]; F[name] = (a, ...rest) => (isArr(a) ? mapArr(a, (x) => f(x, ...rest)) : f(a, ...rest));
}
F.ISNA = (v) => { v = isArr(v) ? v : [[v]]; const out = v.map((row) => row.map((x) => isErr(x) && x.code === "#N/A")); return out.length === 1 && out[0].length === 1 ? out[0][0] : out; };
F.ISERROR = (v) => { v = isArr(v) ? v : [[v]]; const out = v.map((row) => row.map((x) => isErr(x))); return out.length === 1 && out[0].length === 1 ? out[0][0] : out; };
{ // lookup functions accept an array of lookup keys and spill the results
  const liftKey = (name) => { const f = F[name]; F[name] = (k, ...rest) => (isArr(k) ? mapArr(k, (x) => f(x, ...rest)) : f(k, ...rest)); };
  ["MATCH", "XLOOKUP", "VLOOKUP", "HLOOKUP"].forEach(liftKey);
  const liftCrit = (name, pos) => { const f = F[name]; F[name] = (...a) => (isArr(a[pos]) && !(a[pos].length === 1 && a[pos][0].length === 1) ? mapArr(a[pos], (c) => { const b = [...a]; b[pos] = c; return f(...b); }) : f(...a)); };
  liftCrit("SUMIF", 1); liftCrit("COUNTIF", 1); liftCrit("AVERAGEIF", 1);
  const liftIfs = (name, start) => { const f = F[name]; F[name] = (...a) => { const crit = []; for (let i = start; i < a.length; i += 2) if (isArr(a[i]) && !(a[i].length === 1 && a[i][0].length === 1)) crit.push(i); if (!crit.length) return f(...a); const shape = a[crit[0]]; return shape.map((row, r) => row.map((_, c) => { const b = [...a]; for (const i of crit) b[i] = a[i][r]?.[c]; try { return f(...b); } catch (e) { return isErr(e) ? e : ERR("#VALUE!"); } })); }; };
  liftIfs("COUNTIFS", 1); liftIfs("SUMIFS", 2); liftIfs("AVERAGEIFS", 2); liftIfs("MAXIFS", 2); liftIfs("MINIFS", 2);
  const liftK = (name) => { const f = F[name]; F[name] = (r, k) => (isArr(k) ? mapArr(k, (x) => f(r, x)) : f(r, k)); };
  liftK("LARGE"); liftK("SMALL");
  { const f = F.INDEX; F.INDEX = (r, row, col) => (isArr(row) && !(row.length === 1 && row[0].length === 1) ? mapArr(row, (x) => f(r, x, col)) : f(r, row, col)); }
  { const f = F.RANK; F.RANK = F["RANK.EQ"] = (v, r, o) => (isArr(v) && !(v.length === 1 && v[0].length === 1) ? mapArr(v, (x) => f(x, r, o)) : f(v, r, o)); }
}

// ---------- evaluator ----------
function evalNode(n, sheet, bounds) {
  switch (n.t) {
    case "num": case "str": case "bool": return n.v;
    case "empty": return null;
    case "arr": return n.rows.map((row) => row.map((x) => evalNode(x, sheet, bounds)));
    case "ref": { const v = sheet[addr(n.c, n.r)]; return v === undefined ? null : v; }
    case "range": { const out = []; for (let r = n.r1; r <= n.r2; r++) { const row = []; for (let c = n.c1; c <= n.c2; c++) { const v = sheet[addr(c, r)]; row.push(v === undefined ? null : v); } out.push(row); } out.__ref = n; return out; }
    case "neg": return mapArr(evalNode(n.v, sheet, bounds), (x) => -num(x));
    case "pct": return mapArr(evalNode(n.v, sheet, bounds), (x) => num(x) / 100);
    case "bin": {
      const l = evalNode(n.l, sheet, bounds), r = evalNode(n.r, sheet, bounds);
      const ops = { "+": (a, b) => num(a) + num(b), "-": (a, b) => num(a) - num(b), "*": (a, b) => num(a) * num(b), "/": (a, b) => { const d = num(b); if (d === 0) throw ERR("#DIV/0!"); return num(a) / d; }, "^": (a, b) => num(a) ** num(b), "&": (a, b) => str(a) + str(b), "=": (a, b) => cmp(a, b) === 0, "<>": (a, b) => cmp(a, b) !== 0, "<": (a, b) => cmp(a, b) < 0, ">": (a, b) => cmp(a, b) > 0, "<=": (a, b) => cmp(a, b) <= 0, ">=": (a, b) => cmp(a, b) >= 0 };
      return broadcast(l, r, (a, b) => { if (isErr(a)) throw a; if (isErr(b)) throw b; return ops[n.op](a, b); });
    }
    case "fn": {
      const fn = F[n.name]; if (!fn) throw ERR("#NAME?");
      const lazy = n.name === "IF" || n.name === "IFERROR" || n.name === "IFNA" || n.name === "IFS" || n.name === "CHOOSE";
      const args = n.args.map((a) => { try { return evalNode(a, sheet, bounds); } catch (e) { if (isErr(e) && (lazy || n.name === "ISERROR" || n.name === "ISNA")) return e; throw e; } });
      if (!lazy && n.name !== "ISERROR" && n.name !== "ISNA" && n.name !== "SUM" && n.name !== "COUNT" && n.name !== "COUNTA" && n.name !== "AVERAGE" && n.name !== "MAX" && n.name !== "MIN") { for (const a of args) if (isErr(a)) throw a; }
      return fn(...args);
    }
    default: throw ERR("#ERROR!");
  }
}

/** Evaluate a formula string (with or without leading '=') against a sheet map. Returns {value} or {error}. */
export function evaluate(formula, sheet) {
  try {
    const src = formula.trim().replace(/^=/, "");
    if (!src) return { error: "#ERROR!" };
    const v = evalNode(parse(tokenize(src)), sheet);
    if (isErr(v)) return { error: v.code };
    if (isArr(v)) { const clean = v.map((row) => row.map((x) => (isErr(x) ? x.code : x))); delete clean.__ref; return { value: clean }; }
    return { value: v };
  } catch (e) { return { error: isErr(e) ? e.code : "#ERROR!" }; }
}

/** Compare two evaluation results the way a grader should. */
export function resultsMatch(a, b) {
  if (a.error || b.error) return a.error === b.error;
  const norm = (v) => (typeof v === "number" ? Math.round(v * 1e6) / 1e6 : typeof v === "boolean" ? v : v === null || v === undefined ? "" : String(v));
  const A = a.value, B = b.value;
  if (isArr(A) !== isArr(B)) { // allow 1x1 array vs scalar
    const one = isArr(A) ? A : B, other = isArr(A) ? B : A;
    return one.length === 1 && one[0].length === 1 && norm(one[0][0]) === norm(other);
  }
  if (!isArr(A)) return norm(A) === norm(B);
  if (A.length !== B.length) return false;
  return A.every((row, i) => row.length === B[i].length && row.every((x, j) => norm(x) === norm(B[i][j])));
}

/** Build a sheet map from a list of tables placed at given anchors: [{anchor:"A1", headers, rows, types}] */
export function buildSheet(tables) {
  const sheet = {};
  for (const t of tables) {
    const a = parseAddr(t.anchor);
    t.headers.forEach((h, c) => { sheet[addr(a.c + c, a.r)] = h; });
    t.rows.forEach((row, r) => row.forEach((v, c) => { sheet[addr(a.c + c, a.r + 1 + r)] = v; }));
  }
  return sheet;
}
export const FUNCTION_NAMES = Object.keys(F).sort();
