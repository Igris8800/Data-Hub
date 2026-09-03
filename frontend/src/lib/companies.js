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

// ============ META ============
export const META = {
  key: "meta",
  name: "Meta",
  tagline: "Facebook · Instagram · Growth",
  color: "#1877F2",
  logo: "🌐",
  logoUrl: "https://cdn.simpleicons.org/meta/1877F2",
  tables: [
    {
      name: "users", color: "#1877F2",
      columns: [
        { name: "user_id",    type: "INTEGER", tag: "PK" },
        { name: "name",       type: "TEXT" },
        { name: "country",    type: "TEXT" },
        { name: "signup_date",type: "TEXT" },
      ],
      rows: [
        [1, "Ana Costa",     "Brazil",       "2022-03-10"],
        [2, "Ben Cohen",     "USA",          "2022-06-14"],
        [3, "Chloe Dupont",  "France",       "2022-11-05"],
        [4, "Dev Sharma",    "India",        "2023-01-22"],
        [5, "Elena Rossi",   "Italy",        "2023-04-30"],
        [6, "Fumi Sato",     "Japan",        "2023-08-14"],
        [7, "Gabe Miller",   "USA",          "2024-01-05"],
      ],
    },
    {
      name: "posts", color: "#1877F2",
      columns: [
        { name: "post_id",   type: "INTEGER", tag: "PK" },
        { name: "user_id",   type: "INTEGER", tag: "FK" },
        { name: "platform",  type: "TEXT" },
        { name: "post_date", type: "TEXT" },
        { name: "likes",     type: "INTEGER" },
        { name: "comments",  type: "INTEGER" },
      ],
      rows: [
        [101, 1, "instagram", "2024-01-10", 245, 18],
        [102, 2, "facebook",  "2024-01-11",  92,  5],
        [103, 3, "instagram", "2024-01-15", 512, 44],
        [104, 4, "facebook",  "2024-01-20",  38,  2],
        [105, 5, "instagram", "2024-02-01",  180, 12],
        [106, 6, "instagram", "2024-02-05", 720, 65],
        [107, 1, "facebook",  "2024-02-14",  60,  3],
        [108, 4, "instagram", "2024-03-01",  90,  7],
        [109, 7, "instagram", "2024-03-10", 145, 14],
      ],
    },
    {
      name: "friendships", color: "#1877F2",
      columns: [
        { name: "user_a",     type: "INTEGER", tag: "FK" },
        { name: "user_b",     type: "INTEGER", tag: "FK" },
        { name: "created_at", type: "TEXT" },
      ],
      rows: [
        [1, 2, "2022-07-01"],
        [1, 3, "2022-12-15"],
        [2, 4, "2023-02-10"],
        [3, 4, "2023-05-19"],
        [3, 5, "2023-06-22"],
        [4, 5, "2023-09-01"],
        [4, 6, "2023-12-05"],
        [1, 7, "2024-02-14"],
      ],
    },
    {
      name: "ad_campaigns", color: "#1877F2",
      columns: [
        { name: "campaign_id", type: "INTEGER", tag: "PK" },
        { name: "advertiser",  type: "TEXT" },
        { name: "spend",       type: "INTEGER" },
        { name: "impressions", type: "INTEGER" },
        { name: "conversions", type: "INTEGER" },
      ],
      rows: [
        [1, "Nike",     50000, 1200000, 3200],
        [2, "Shopify",  70000, 1400000, 5100],
        [3, "Airbnb",   35000,  900000, 1600],
        [4, "Netflix",  90000, 2000000, 7100],
        [5, "Zoom",     22000,  500000,  900],
      ],
    },
  ],
  questions: [
    { id: "met-e-1", difficulty: "beginner", title: "Instagram posts only", context: "The Instagram team wants a slice of just IG content.", task: "Return post_id, user_id and likes for posts on Instagram, ordered by likes descending.", output: "post_id, user_id, likes", rules: "Filter platform = 'instagram'.", answer: "SELECT post_id, user_id, likes FROM posts WHERE platform = 'instagram' ORDER BY likes DESC;", hint: "WHERE + ORDER BY.", solution: "SELECT post_id, user_id, likes FROM posts WHERE platform = 'instagram' ORDER BY likes DESC;" },
    { id: "met-e-2", difficulty: "beginner", title: "New signups 2024", context: "Growth wants only users who joined in 2024.", task: "Return name and country for users whose signup_date is in 2024.", output: "name, country", rules: "Use strftime OR the yyyy prefix. signup_date LIKE '2024%'.", answer: "SELECT name, country FROM users WHERE signup_date LIKE '2024%';", hint: "LIKE '2024%'", solution: "SELECT name, country FROM users WHERE signup_date LIKE '2024%';" },
    { id: "met-m-1", difficulty: "intermediate", title: "Average likes per user", context: "The engagement team benchmarks average likes.", task: "For each user with at least one post, return name and their average likes (rounded to 1 decimal). Sort desc.", output: "name, avg_likes", rules: "JOIN + AVG + GROUP BY.", answer: "SELECT u.name, ROUND(AVG(p.likes), 1) AS avg_likes FROM users u JOIN posts p ON p.user_id = u.user_id GROUP BY u.user_id ORDER BY avg_likes DESC;", hint: "AVG(likes) grouped by user.", solution: "SELECT u.name, ROUND(AVG(p.likes), 1) AS avg_likes FROM users u JOIN posts p ON p.user_id = u.user_id GROUP BY u.user_id ORDER BY avg_likes DESC;" },
    { id: "met-m-2", difficulty: "intermediate", title: "Friend count per user", context: "Growth Data wants a distribution of friend counts.", task: "For every user, return name and total friendships (either side of the pair). Sort desc.", output: "name, friend_count", rules: "friendships is undirected — count rows where user_id appears in EITHER user_a OR user_b.", answer: "SELECT u.name, COUNT(*) AS friend_count FROM users u JOIN friendships f ON u.user_id = f.user_a OR u.user_id = f.user_b GROUP BY u.user_id ORDER BY friend_count DESC;", hint: "Join with OR on both sides.", solution: "SELECT u.name, COUNT(*) AS friend_count FROM users u JOIN friendships f ON u.user_id = f.user_a OR u.user_id = f.user_b GROUP BY u.user_id ORDER BY friend_count DESC;" },
    { id: "met-h-1", difficulty: "advanced", title: "Best-converting ad campaigns", context: "Meta Ads leadership wants the conversion rate ranking.", task: "For every campaign return advertiser and conv_rate = conversions / impressions (rounded to 4 decimals). Rank them with RANK() ordered by conv_rate desc. Return advertiser, conv_rate, rank_pos.", output: "advertiser, conv_rate, rank_pos", rules: "Use RANK() window function.", answer: "SELECT advertiser, ROUND(1.0 * conversions / impressions, 4) AS conv_rate, RANK() OVER (ORDER BY 1.0 * conversions / impressions DESC) AS rank_pos FROM ad_campaigns ORDER BY rank_pos;", hint: "RANK() OVER (ORDER BY conv_rate DESC).", solution: "SELECT advertiser, ROUND(1.0 * conversions / impressions, 4) AS conv_rate, RANK() OVER (ORDER BY 1.0 * conversions / impressions DESC) AS rank_pos FROM ad_campaigns ORDER BY rank_pos;" },
    { id: "met-h-2", difficulty: "advanced", title: "Mutual friend suggestion", context: "The People You May Know team wants pairs of users who share at least one common friend but aren't friends themselves.", task: "Return two user_ids (u1 < u2) who are NOT friends but share at least one mutual friend. Return u1, u2, mutuals count.", output: "u1, u2, mutuals", rules: "Self-join friendships to find shared connections. Exclude direct pairs already in friendships.", answer: "SELECT a.user_b AS u1, b.user_b AS u2, COUNT(*) AS mutuals FROM friendships a JOIN friendships b ON a.user_a = b.user_a AND a.user_b < b.user_b WHERE NOT EXISTS (SELECT 1 FROM friendships f WHERE (f.user_a = a.user_b AND f.user_b = b.user_b) OR (f.user_a = b.user_b AND f.user_b = a.user_b)) GROUP BY a.user_b, b.user_b ORDER BY mutuals DESC, u1, u2;", hint: "Self-join on user_a, filter unfriended pairs.", solution: "SELECT a.user_b AS u1, b.user_b AS u2, COUNT(*) AS mutuals FROM friendships a JOIN friendships b ON a.user_a = b.user_a AND a.user_b < b.user_b WHERE NOT EXISTS (SELECT 1 FROM friendships f WHERE (f.user_a = a.user_b AND f.user_b = b.user_b) OR (f.user_a = b.user_b AND f.user_b = a.user_b)) GROUP BY a.user_b, b.user_b ORDER BY mutuals DESC, u1, u2;" },
  ],
};

export const COMPANIES = [AMAZON, NETFLIX, UBER, GOOGLE, META];
