/**
 * Professional-grade multi-company SQL schemas with realistic seed data.
 * Each company has: tables (with columns, types, PK/FK), seed rows, and 6-10 practice questions.
 */

// Helper to render CREATE + INSERT statements from a table definition
function buildTableSQL(t) {
  const cols = t.columns.map(c => {
    let s = `${c.name} ${c.type}`;
    if (c.tag === "PK") s += " PRIMARY KEY";
    return s;
  }).join(", ");
  const create = `CREATE TABLE ${t.name} (${cols});`;
  const inserts = t.rows.length
    ? `INSERT INTO ${t.name} VALUES ${t.rows.map(r => `(${r.map(v => v == null ? "NULL" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v).join(",")})`).join(",")};`
    : "";
  return create + "\n" + inserts;
}

export function buildSeed(company) {
  return company.tables.map(buildTableSQL).join("\n\n");
}

import { AMAZON } from "./companies/amazon";

import { NETFLIX } from "./companies/netflix";

import { UBER } from "./companies/uber";

import { GOOGLE } from "./companies/google";

import { META } from "./companies/meta";

export const COMPANIES = [AMAZON, NETFLIX, UBER, GOOGLE, META];
