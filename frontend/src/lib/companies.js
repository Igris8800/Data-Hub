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

// ============ AMAZON ============
export const AMAZON = {
  key: "amazon",
  name: "Amazon",
  tagline: "E-commerce · Fulfillment · Reviews",
  color: "#FF9900",
  logo: "🛒",
  tables: [
    {
      name: "customers", color: "#FF9900",
      columns: [
        { name: "customer_id", type: "INTEGER", tag: "PK" },
        { name: "first_name",  type: "TEXT" },
        { name: "last_name",   type: "TEXT" },
        { name: "email",       type: "TEXT" },
        { name: "country",     type: "TEXT" },
        { name: "prime_member",type: "INTEGER" },
        { name: "signup_date", type: "TEXT" },
      ],
      rows: [
        [1, "Sarah",   "Chen",     "sarah.chen@example.com",     "USA",   1, "2022-03-14"],
        [2, "Aditya",  "Kumar",    "aditya.k@example.com",       "India", 1, "2022-07-01"],
        [3, "Marco",   "Rossi",    "marco.rossi@example.com",    "Italy", 0, "2023-01-22"],
        [4, "Yuki",    "Tanaka",   "yuki.t@example.com",         "Japan", 1, "2023-02-05"],
        [5, "Amir",    "Hassan",   "amir.hassan@example.com",    "UAE",   0, "2023-06-11"],
        [6, "Priya",   "Sharma",   "priya.s@example.com",        "India", 1, "2023-09-19"],
        [7, "Chloe",   "Martin",   "chloe.m@example.com",        "France",0, "2024-01-10"],
        [8, "David",   "Wilson",   "david.w@example.com",        "USA",   1, "2024-02-28"],
      ],
    },
    {
      name: "products", color: "#FF9900",
      columns: [
        { name: "product_id",  type: "INTEGER", tag: "PK" },
        { name: "name",        type: "TEXT" },
        { name: "category",    type: "TEXT" },
        { name: "price",       type: "REAL" },
        { name: "stock",       type: "INTEGER" },
      ],
      rows: [
        [101, "Echo Dot (5th Gen)",     "Electronics", 49.99,  120],
        [102, "Kindle Paperwhite",      "Electronics", 139.99, 60],
        [103, "Instant Pot Duo",        "Kitchen",     89.00,  40],
        [104, "AirPods Pro",            "Electronics", 249.00, 25],
        [105, "Lego Star Wars Set",     "Toys",        79.99,  75],
        [106, "Fire TV Stick 4K",       "Electronics", 44.99,  200],
        [107, "Yoga Mat Premium",       "Sports",      29.99,  150],
      ],
    },
    {
      name: "orders", color: "#FF9900",
      columns: [
        { name: "order_id",    type: "INTEGER", tag: "PK" },
        { name: "customer_id", type: "INTEGER", tag: "FK" },
        { name: "order_date",  type: "TEXT" },
        { name: "total_amount",type: "REAL" },
        { name: "status",      type: "TEXT" },
      ],
      rows: [
        [5001, 1, "2024-01-08", 189.98, "delivered"],
        [5002, 2, "2024-01-15", 249.00, "delivered"],
        [5003, 3, "2024-02-02",  49.99, "cancelled"],
        [5004, 1, "2024-02-11", 139.99, "delivered"],
        [5005, 4, "2024-02-20",  89.00, "delivered"],
        [5006, 6, "2024-03-05", 324.97, "delivered"],
        [5007, 5, "2024-03-14",  44.99, "returned"],
        [5008, 8, "2024-04-01", 249.00, "delivered"],
        [5009, 7, "2024-04-10",  79.99, "pending"],
      ],
    },
    {
      name: "reviews", color: "#FF9900",
      columns: [
        { name: "review_id",  type: "INTEGER", tag: "PK" },
        { name: "product_id", type: "INTEGER", tag: "FK" },
        { name: "customer_id",type: "INTEGER", tag: "FK" },
        { name: "rating",     type: "INTEGER" },
        { name: "review_date",type: "TEXT" },
      ],
      rows: [
        [9001, 101, 1, 5, "2024-01-20"],
        [9002, 102, 1, 4, "2024-02-15"],
        [9003, 103, 4, 5, "2024-02-25"],
        [9004, 104, 2, 5, "2024-01-20"],
        [9005, 105, 6, 3, "2024-03-15"],
        [9006, 106, 5, 2, "2024-03-20"],
        [9007, 101, 8, 5, "2024-04-08"],
        [9008, 107, 6, 4, "2024-04-12"],
      ],
    },
    {
      name: "warehouses", color: "#FF9900",
      columns: [
        { name: "warehouse_id",  type: "INTEGER", tag: "PK" },
        { name: "warehouse_name",type: "TEXT" },
        { name: "location",      type: "TEXT" },
        { name: "capacity",      type: "INTEGER" },
      ],
      rows: [
        [1, "SEA1", "Seattle, WA",   50000],
        [2, "BOM3", "Mumbai, India", 40000],
        [3, "LHR4", "London, UK",    35000],
        [4, "TYO2", "Tokyo, Japan",  30000],
      ],
    },
    {
      name: "employees", color: "#FF9900",
      columns: [
        { name: "employee_id",  type: "INTEGER", tag: "PK" },
        { name: "first_name",   type: "TEXT" },
        { name: "last_name",    type: "TEXT" },
        { name: "department",   type: "TEXT" },
        { name: "salary",       type: "INTEGER" },
        { name: "warehouse_id", type: "INTEGER", tag: "FK" },
      ],
      rows: [
        [1, "Emma",  "Johnson", "Fulfillment",  62000, 1],
        [2, "Liam",  "Brown",   "Logistics",    58000, 1],
        [3, "Olivia","Davis",   "Fulfillment",  65000, 2],
        [4, "Noah",  "Miller",  "Engineering",  145000, null],
        [5, "Ava",   "Wilson",  "Logistics",    54000, 3],
        [6, "Ethan", "Moore",   "Fulfillment",  59000, 4],
        [7, "Sophia","Taylor",  "Engineering",  132000, null],
      ],
    },
  ],
  questions: [
    { id: "amz-e-1", difficulty: "beginner", title: "All Prime members", context: "The growth team is preparing a Prime-exclusive promotion.", task: "List first name, last name and country for every customer who is a Prime member.", output: "first_name, last_name, country", rules: "Filter by prime_member = 1. Do not include non-Prime customers.", answer: "SELECT first_name, last_name, country FROM customers WHERE prime_member = 1;", hint: "Use WHERE on the prime_member column.", solution: "SELECT first_name, last_name, country FROM customers WHERE prime_member = 1;" },
    { id: "amz-e-2", difficulty: "beginner", title: "Employee warehouse assignment", context: "Fulfillment Operations is reviewing warehouse staffing to see where each warehouse employee is currently located.", task: "Which employees are assigned to a warehouse, and what is the warehouse location for each of them?", output: "first_name, last_name, location", rules: "Only include employees with a warehouse assignment (warehouse_id IS NOT NULL). Join employees to warehouses.", answer: "SELECT e.first_name, e.last_name, w.location FROM employees e JOIN warehouses w ON e.warehouse_id = w.warehouse_id;", hint: "INNER JOIN drops the rows where warehouse_id is NULL for free.", solution: "SELECT e.first_name, e.last_name, w.location FROM employees e JOIN warehouses w ON e.warehouse_id = w.warehouse_id;" },
    { id: "amz-e-3", difficulty: "beginner", title: "Products in stock", context: "Merchandising wants a quick view of what's currently sellable.", task: "Return all product names and prices where stock is greater than 50, ordered by price descending.", output: "name, price", rules: "Filter stock > 50. Sort by price descending.", answer: "SELECT name, price FROM products WHERE stock > 50 ORDER BY price DESC;", hint: "WHERE + ORDER BY DESC.", solution: "SELECT name, price FROM products WHERE stock > 50 ORDER BY price DESC;" },
    { id: "amz-m-1", difficulty: "intermediate", title: "Revenue per category", context: "Finance is closing the quarter and needs revenue by product category.", task: "Return each category and the sum of total_amount from delivered orders that contain that category’s products. Use products.price × orders.total_amount is NOT correct — join orders to products via product category and sum orders.total_amount grouped by category.", output: "category, revenue", rules: "Only count status = 'delivered'. Group by category.", answer: "SELECT p.category, SUM(o.total_amount) AS revenue FROM orders o JOIN products p ON o.total_amount >= p.price WHERE o.status = 'delivered' GROUP BY p.category ORDER BY revenue DESC;", hint: "Aggregate SUM with GROUP BY category.", solution: "SELECT p.category, SUM(o.total_amount) AS revenue FROM orders o JOIN products p ON o.total_amount >= p.price WHERE o.status = 'delivered' GROUP BY p.category ORDER BY revenue DESC;" },
    { id: "amz-m-2", difficulty: "intermediate", title: "Top reviewers", context: "Customer Trust wants to celebrate the most active reviewers.", task: "For each customer who has written 2 or more reviews, return their full name and the review count.", output: "first_name, last_name, review_count", rules: "HAVING COUNT(*) >= 2. Join reviews to customers.", answer: "SELECT c.first_name, c.last_name, COUNT(*) AS review_count FROM reviews r JOIN customers c ON c.customer_id = r.customer_id GROUP BY c.customer_id HAVING COUNT(*) >= 2 ORDER BY review_count DESC;", hint: "Aggregate with HAVING.", solution: "SELECT c.first_name, c.last_name, COUNT(*) AS review_count FROM reviews r JOIN customers c ON c.customer_id = r.customer_id GROUP BY c.customer_id HAVING COUNT(*) >= 2;" },
    { id: "amz-h-1", difficulty: "advanced", title: "Rank customers by spend", context: "The Growth team wants a leaderboard of top spenders for the loyalty program launch.", task: "Rank each customer by total delivered spend. Return first_name, last_name, total_spend, and rank_position.", output: "first_name, last_name, total_spend, rank_position", rules: "Use RANK() window function. Only count delivered orders.", answer: "SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spend, RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS rank_position FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.status = 'delivered' GROUP BY c.customer_id ORDER BY rank_position;", hint: "SUM(...) then RANK() OVER (ORDER BY SUM(...) DESC).", solution: "SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spend, RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS rank_position FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.status = 'delivered' GROUP BY c.customer_id ORDER BY rank_position;" },
  ],
};

// ============ NETFLIX ============
export const NETFLIX = {
  key: "netflix",
  name: "Netflix",
  tagline: "Streaming · Subscriptions · Content",
  color: "#E50914",
  logo: "🎬",
  tables: [
    {
      name: "users", color: "#E50914",
      columns: [
        { name: "user_id",      type: "INTEGER", tag: "PK" },
        { name: "email",        type: "TEXT" },
        { name: "country",      type: "TEXT" },
        { name: "plan",         type: "TEXT" },
        { name: "signup_date",  type: "TEXT" },
      ],
      rows: [
        [1, "user1@nx.com", "USA",    "premium",  "2022-01-10"],
        [2, "user2@nx.com", "India",  "basic",    "2022-05-22"],
        [3, "user3@nx.com", "Brazil", "standard", "2023-02-14"],
        [4, "user4@nx.com", "UK",     "premium",  "2023-04-01"],
        [5, "user5@nx.com", "USA",    "standard", "2023-07-19"],
        [6, "user6@nx.com", "India",  "premium",  "2024-01-05"],
      ],
    },
    {
      name: "shows", color: "#E50914",
      columns: [
        { name: "show_id",     type: "INTEGER", tag: "PK" },
        { name: "title",       type: "TEXT" },
        { name: "genre",       type: "TEXT" },
        { name: "release_year",type: "INTEGER" },
        { name: "type",        type: "TEXT" },
      ],
      rows: [
        [101, "Stranger Things",    "Sci-Fi",    2016, "series"],
        [102, "The Crown",          "Drama",     2016, "series"],
        [103, "Wednesday",          "Fantasy",   2022, "series"],
        [104, "Extraction 2",       "Action",    2023, "movie"],
        [105, "The Queen's Gambit", "Drama",     2020, "series"],
        [106, "Squid Game",         "Thriller",  2021, "series"],
      ],
    },
    {
      name: "views", color: "#E50914",
      columns: [
        { name: "view_id",       type: "INTEGER", tag: "PK" },
        { name: "user_id",       type: "INTEGER", tag: "FK" },
        { name: "show_id",       type: "INTEGER", tag: "FK" },
        { name: "watch_date",    type: "TEXT" },
        { name: "minutes_watched",type: "INTEGER" },
      ],
      rows: [
        [1, 1, 101, "2024-01-05", 240],
        [2, 1, 106, "2024-01-12", 320],
        [3, 2, 103, "2024-02-01",  90],
        [4, 3, 105, "2024-02-11", 420],
        [5, 4, 101, "2024-02-20", 180],
        [6, 5, 102, "2024-03-01", 210],
        [7, 6, 106, "2024-03-05", 480],
        [8, 4, 104, "2024-03-14", 130],
        [9, 1, 105, "2024-03-22", 350],
      ],
    },
    {
      name: "subscriptions", color: "#E50914",
      columns: [
        { name: "subscription_id", type: "INTEGER", tag: "PK" },
        { name: "user_id",         type: "INTEGER", tag: "FK" },
        { name: "plan",            type: "TEXT" },
        { name: "monthly_price",   type: "REAL" },
        { name: "start_date",      type: "TEXT" },
        { name: "end_date",        type: "TEXT" },
        { name: "status",          type: "TEXT" },
      ],
      rows: [
        [1, 1, "premium",  22.99, "2022-01-10", null,         "active"],
        [2, 2, "basic",     6.99, "2022-05-22", "2023-11-30", "cancelled"],
        [3, 2, "standard", 15.49, "2023-12-01", null,         "active"],
        [4, 3, "standard", 15.49, "2023-02-14", null,         "active"],
        [5, 4, "premium",  22.99, "2023-04-01", "2024-02-20", "cancelled"],
        [6, 4, "standard", 15.49, "2024-02-21", null,         "active"],
        [7, 5, "standard", 15.49, "2023-07-19", null,         "active"],
        [8, 6, "premium",  22.99, "2024-01-05", null,         "active"],
      ],
    },
  ],
  questions: [
    { id: "nfx-e-1", difficulty: "beginner", title: "Premium users", context: "Marketing wants a targeted list for a premium-only feature announcement.", task: "Return email and country for every user on the premium plan.", output: "email, country", rules: "Filter plan = 'premium'.", answer: "SELECT email, country FROM users WHERE plan = 'premium';", hint: "WHERE plan = 'premium'", solution: "SELECT email, country FROM users WHERE plan = 'premium';" },
    { id: "nfx-e-2", difficulty: "beginner", title: "Shows released after 2020", context: "The content team is building a 'What's new' shelf.", task: "List titles and genres of shows released after 2020, sorted alphabetically by title.", output: "title, genre", rules: "WHERE release_year > 2020, ORDER BY title.", answer: "SELECT title, genre FROM shows WHERE release_year > 2020 ORDER BY title;", hint: "Simple WHERE + ORDER BY.", solution: "SELECT title, genre FROM shows WHERE release_year > 2020 ORDER BY title;" },
    { id: "nfx-m-1", difficulty: "intermediate", title: "Total minutes per show", context: "Content Strategy wants to see engagement per show.", task: "Return show title and total minutes_watched across all users, sorted descending.", output: "title, total_minutes", rules: "JOIN + SUM + GROUP BY + ORDER BY.", answer: "SELECT s.title, SUM(v.minutes_watched) AS total_minutes FROM shows s JOIN views v ON v.show_id = s.show_id GROUP BY s.show_id ORDER BY total_minutes DESC;", hint: "JOIN then aggregate.", solution: "SELECT s.title, SUM(v.minutes_watched) AS total_minutes FROM shows s JOIN views v ON v.show_id = s.show_id GROUP BY s.show_id ORDER BY total_minutes DESC;" },
    { id: "nfx-m-2", difficulty: "intermediate", title: "Country subscribers", context: "Finance is preparing the quarterly regional breakdown.", task: "Count users per country, only include countries with 2 or more users, ordered by count desc.", output: "country, user_count", rules: "GROUP BY country, HAVING COUNT(*) >= 2.", answer: "SELECT country, COUNT(*) AS user_count FROM users GROUP BY country HAVING COUNT(*) >= 2 ORDER BY user_count DESC;", hint: "GROUP BY + HAVING.", solution: "SELECT country, COUNT(*) AS user_count FROM users GROUP BY country HAVING COUNT(*) >= 2 ORDER BY user_count DESC;" },
    { id: "nfx-h-1", difficulty: "advanced", title: "Top show per user", context: "The personalization team wants each user's most-watched show for the wrap-up email.", task: "For each user, return their user_id and the title of their most-watched show (by minutes).", output: "user_id, title", rules: "Use a window function (ROW_NUMBER) to pick the top show per user.", answer: "SELECT user_id, title FROM (SELECT v.user_id, s.title, ROW_NUMBER() OVER (PARTITION BY v.user_id ORDER BY v.minutes_watched DESC) AS rn FROM views v JOIN shows s ON s.show_id = v.show_id) t WHERE rn = 1 ORDER BY user_id;", hint: "PARTITION BY user_id ORDER BY minutes DESC.", solution: "SELECT user_id, title FROM (SELECT v.user_id, s.title, ROW_NUMBER() OVER (PARTITION BY v.user_id ORDER BY v.minutes_watched DESC) AS rn FROM views v JOIN shows s ON s.show_id = v.show_id) t WHERE rn = 1 ORDER BY user_id;" },
    { id: "nfx-m-3", difficulty: "intermediate", title: "Monthly Recurring Revenue (MRR)", context: "Finance is preparing the quarterly board deck and needs current MRR broken down by plan.", task: "For every active subscription, sum monthly_price grouped by plan. Return plan and mrr, ordered by mrr descending.", output: "plan, mrr", rules: "Filter status = 'active'. Aggregate SUM(monthly_price) grouped by plan.", answer: "SELECT plan, SUM(monthly_price) AS mrr FROM subscriptions WHERE status = 'active' GROUP BY plan ORDER BY mrr DESC;", hint: "GROUP BY plan on active rows only.", solution: "SELECT plan, SUM(monthly_price) AS mrr FROM subscriptions WHERE status = 'active' GROUP BY plan ORDER BY mrr DESC;" },
    { id: "nfx-h-2", difficulty: "advanced", title: "Churned subscribers list", context: "Retention wants to reach out to users who cancelled their subscription and have not restarted.", task: "Return email of users whose ONLY subscriptions are all cancelled (i.e. they have no active subscription right now).", output: "email", rules: "Use NOT EXISTS or aggregate check. A user with any active subscription should not appear.", answer: "SELECT u.email FROM users u WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.user_id AND s.status = 'active');", hint: "NOT EXISTS is the cleanest way.", solution: "SELECT u.email FROM users u WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.user_id AND s.status = 'active');" },
  ],
};

// ============ UBER ============
export const UBER = {
  key: "uber",
  name: "Uber",
  tagline: "Rideshare · Drivers · Payments",
  color: "#000000",
  logo: "🚗",
  tables: [
    {
      name: "drivers", color: "#00D4FF",
      columns: [
        { name: "driver_id",   type: "INTEGER", tag: "PK" },
        { name: "name",        type: "TEXT" },
        { name: "city",        type: "TEXT" },
        { name: "rating",      type: "REAL" },
        { name: "join_date",   type: "TEXT" },
      ],
      rows: [
        [1, "James Fox",     "San Francisco", 4.92, "2020-03-15"],
        [2, "Ravi Patel",    "Mumbai",         4.85, "2021-07-01"],
        [3, "Sofia Lopez",   "Mexico City",    4.79, "2021-11-20"],
        [4, "Ahmed Ali",     "Dubai",          4.95, "2022-02-10"],
        [5, "Elena Ivanov",  "London",         4.68, "2023-01-05"],
      ],
    },
    {
      name: "riders", color: "#00D4FF",
      columns: [
        { name: "rider_id",   type: "INTEGER", tag: "PK" },
        { name: "name",       type: "TEXT" },
        { name: "city",       type: "TEXT" },
        { name: "signup_date",type: "TEXT" },
      ],
      rows: [
        [1, "Ava Reed",       "San Francisco", "2022-05-10"],
        [2, "Karan Mehta",    "Mumbai",         "2023-01-15"],
        [3, "Lucia Garcia",   "Mexico City",    "2023-04-22"],
        [4, "Sara Al-Hashem", "Dubai",          "2023-09-01"],
      ],
    },
    {
      name: "rides", color: "#00D4FF",
      columns: [
        { name: "ride_id",    type: "INTEGER", tag: "PK" },
        { name: "driver_id",  type: "INTEGER", tag: "FK" },
        { name: "rider_id",   type: "INTEGER", tag: "FK" },
        { name: "fare",       type: "REAL" },
        { name: "distance_km",type: "REAL" },
        { name: "ride_date",  type: "TEXT" },
        { name: "status",     type: "TEXT" },
      ],
      rows: [
        [1001, 1, 1, 18.50, 4.2,  "2024-01-05", "completed"],
        [1002, 1, 1, 22.00, 5.6,  "2024-01-11", "completed"],
        [1003, 2, 2, 12.00, 8.1,  "2024-01-15", "completed"],
        [1004, 3, 3, 15.75, 6.3,  "2024-02-01", "completed"],
        [1005, 4, 4, 42.30, 15.2, "2024-02-14", "completed"],
        [1006, 2, 2,  9.50, 3.4,  "2024-02-20", "cancelled"],
        [1007, 1, 1, 31.00, 8.9,  "2024-03-05", "completed"],
        [1008, 5, null, 0,   0,   "2024-03-08", "cancelled"],
      ],
    },
  ],
  questions: [
    { id: "ubr-e-1", difficulty: "beginner", title: "5-star drivers", context: "Ops wants to shortlist candidates for a Diamond program.", task: "Return name and city of drivers with rating ≥ 4.9.", output: "name, city", rules: "Filter rating >= 4.9.", answer: "SELECT name, city FROM drivers WHERE rating >= 4.9;", hint: "WHERE rating >= 4.9.", solution: "SELECT name, city FROM drivers WHERE rating >= 4.9;" },
    { id: "ubr-e-2", difficulty: "beginner", title: "Completed rides", context: "Finance is closing the month.", task: "Sum the fare of all completed rides. Return one row with column total_revenue.", output: "total_revenue", rules: "Filter status = 'completed'. SUM(fare).", answer: "SELECT SUM(fare) AS total_revenue FROM rides WHERE status = 'completed';", hint: "SUM with WHERE.", solution: "SELECT SUM(fare) AS total_revenue FROM rides WHERE status = 'completed';" },
    { id: "ubr-m-1", difficulty: "intermediate", title: "Revenue per driver", context: "Payroll needs completed-ride earnings by driver.", task: "For each driver, return their name and total earnings from completed rides, ordered desc.", output: "name, earnings", rules: "JOIN + SUM + GROUP BY + only completed status.", answer: "SELECT d.name, SUM(r.fare) AS earnings FROM drivers d JOIN rides r ON r.driver_id = d.driver_id WHERE r.status = 'completed' GROUP BY d.driver_id ORDER BY earnings DESC;", hint: "GROUP BY driver.", solution: "SELECT d.name, SUM(r.fare) AS earnings FROM drivers d JOIN rides r ON r.driver_id = d.driver_id WHERE r.status = 'completed' GROUP BY d.driver_id ORDER BY earnings DESC;" },
    { id: "ubr-h-1", difficulty: "advanced", title: "Cancellation rate by city", context: "Trust & Safety wants a heat-map of ride cancellations per driver city.", task: "Return each driver city with cancellation rate = cancelled_rides / total_rides, rounded to 2 decimals, ordered desc.", output: "city, cancellation_rate", rules: "Use conditional aggregation (SUM CASE WHEN).", answer: "SELECT d.city, ROUND(1.0 * SUM(CASE WHEN r.status='cancelled' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancellation_rate FROM drivers d JOIN rides r ON r.driver_id = d.driver_id GROUP BY d.city ORDER BY cancellation_rate DESC;", hint: "SUM(CASE WHEN...) / COUNT(*).", solution: "SELECT d.city, ROUND(1.0 * SUM(CASE WHEN r.status='cancelled' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancellation_rate FROM drivers d JOIN rides r ON r.driver_id = d.driver_id GROUP BY d.city ORDER BY cancellation_rate DESC;" },
  ],
};

// ============ GOOGLE ============
export const GOOGLE = {
  key: "google",
  name: "Google",
  tagline: "Search · Ads · YouTube",
  color: "#4285F4",
  logo: "🔍",
  tables: [
    {
      name: "users", color: "#4285F4",
      columns: [
        { name: "user_id",    type: "INTEGER", tag: "PK" },
        { name: "email",      type: "TEXT" },
        { name: "country",    type: "TEXT" },
        { name: "device",     type: "TEXT" },
        { name: "signup_date",type: "TEXT" },
      ],
      rows: [
        [1, "alice@gmail.com",   "USA",    "mobile",  "2023-02-14"],
        [2, "bharath@gmail.com", "India",  "desktop", "2023-05-20"],
        [3, "chen@gmail.com",    "China",  "mobile",  "2023-08-11"],
        [4, "diego@gmail.com",   "Brazil", "mobile",  "2024-01-03"],
        [5, "emma@gmail.com",    "UK",     "desktop", "2024-01-30"],
        [6, "farah@gmail.com",   "UAE",    "mobile",  "2024-02-18"],
      ],
    },
    {
      name: "searches", color: "#4285F4",
      columns: [
        { name: "search_id",   type: "INTEGER", tag: "PK" },
        { name: "user_id",     type: "INTEGER", tag: "FK" },
        { name: "query",       type: "TEXT" },
        { name: "search_date", type: "TEXT" },
        { name: "clicked",     type: "INTEGER" },
      ],
      rows: [
        [1, 1, "flights to tokyo",       "2024-03-01", 1],
        [2, 1, "best headphones 2024",   "2024-03-01", 1],
        [3, 2, "python pandas tutorial", "2024-03-02", 1],
        [4, 3, "how to make dumplings",  "2024-03-02", 0],
        [5, 2, "sql window functions",   "2024-03-03", 1],
        [6, 4, "world cup 2026",         "2024-03-03", 1],
        [7, 5, "wimbledon 2024 results", "2024-03-04", 0],
        [8, 6, "united emirates weather","2024-03-04", 1],
        [9, 1, "cheap flights to tokyo", "2024-03-05", 0],
      ],
    },
    {
      name: "ad_campaigns", color: "#4285F4",
      columns: [
        { name: "campaign_id", type: "INTEGER", tag: "PK" },
        { name: "advertiser",  type: "TEXT" },
        { name: "budget",      type: "INTEGER" },
        { name: "status",      type: "TEXT" },
      ],
      rows: [
        [10, "Nike",        50000, "active"],
        [11, "Coca-Cola",   80000, "active"],
        [12, "Airbnb",      30000, "paused"],
        [13, "Samsung",    120000, "active"],
        [14, "Uber",        45000, "active"],
      ],
    },
    {
      name: "ad_impressions", color: "#4285F4",
      columns: [
        { name: "impression_id", type: "INTEGER", tag: "PK" },
        { name: "campaign_id",   type: "INTEGER", tag: "FK" },
        { name: "user_id",       type: "INTEGER", tag: "FK" },
        { name: "cost",          type: "REAL" },
        { name: "clicked",       type: "INTEGER" },
        { name: "impression_date",type: "TEXT" },
      ],
      rows: [
        [201, 10, 1, 0.42, 1, "2024-03-01"],
        [202, 11, 2, 0.31, 0, "2024-03-01"],
        [203, 13, 3, 0.55, 1, "2024-03-02"],
        [204, 10, 4, 0.38, 0, "2024-03-02"],
        [205, 14, 5, 0.44, 1, "2024-03-03"],
        [206, 11, 6, 0.29, 1, "2024-03-03"],
        [207, 13, 1, 0.51, 0, "2024-03-04"],
        [208, 14, 2, 0.47, 1, "2024-03-05"],
      ],
    },
    {
      name: "employees", color: "#4285F4",
      columns: [
        { name: "employee_id", type: "INTEGER", tag: "PK" },
        { name: "name",        type: "TEXT" },
        { name: "org",         type: "TEXT" },
        { name: "level",       type: "TEXT" },
        { name: "salary",      type: "INTEGER" },
        { name: "location",    type: "TEXT" },
      ],
      rows: [
        [1, "Sundar P.",   "Executive", "L11", 2200000, "Mountain View"],
        [2, "Sara Kim",    "Search",    "L5",   210000, "Mountain View"],
        [3, "Ravi Menon",  "Ads",       "L6",   285000, "Bangalore"],
        [4, "Zoe Chen",    "YouTube",   "L4",   170000, "San Bruno"],
        [5, "Ali Reza",    "Ads",       "L7",   360000, "London"],
        [6, "Nia Okoye",   "Cloud",     "L5",   225000, "New York"],
        [7, "Tom Alvarez", "Search",    "L4",   165000, "Zurich"],
      ],
    },
  ],
  questions: [
    { id: "goo-e-1", difficulty: "beginner", title: "Mobile users only", context: "The mobile-web team wants a list of users who signed up on mobile.", task: "Return email and country for every user whose device is 'mobile'.", output: "email, country", rules: "Filter device = 'mobile'.", answer: "SELECT email, country FROM users WHERE device = 'mobile';", hint: "WHERE device = 'mobile'.", solution: "SELECT email, country FROM users WHERE device = 'mobile';" },
    { id: "goo-e-2", difficulty: "beginner", title: "Active ad campaigns", context: "Finance is auditing running campaigns.", task: "Return advertiser and budget of every active campaign, sorted by budget descending.", output: "advertiser, budget", rules: "status = 'active' + ORDER BY budget DESC.", answer: "SELECT advertiser, budget FROM ad_campaigns WHERE status = 'active' ORDER BY budget DESC;", hint: "Standard WHERE + ORDER BY.", solution: "SELECT advertiser, budget FROM ad_campaigns WHERE status = 'active' ORDER BY budget DESC;" },
    { id: "goo-m-1", difficulty: "intermediate", title: "Click-through rate per campaign", context: "Ads Quality needs each campaign's CTR = clicks / impressions.", task: "For every campaign, return advertiser and CTR (rounded to 2 decimals). Include campaigns with impressions only.", output: "advertiser, ctr", rules: "SUM(clicked) / COUNT(*) grouped per campaign, joined to ad_campaigns.", answer: "SELECT c.advertiser, ROUND(1.0 * SUM(i.clicked) / COUNT(*), 2) AS ctr FROM ad_campaigns c JOIN ad_impressions i ON i.campaign_id = c.campaign_id GROUP BY c.campaign_id ORDER BY ctr DESC;", hint: "SUM(clicked) / COUNT(*) after JOIN.", solution: "SELECT c.advertiser, ROUND(1.0 * SUM(i.clicked) / COUNT(*), 2) AS ctr FROM ad_campaigns c JOIN ad_impressions i ON i.campaign_id = c.campaign_id GROUP BY c.campaign_id ORDER BY ctr DESC;" },
    { id: "goo-m-2", difficulty: "intermediate", title: "Repeat searchers", context: "Search Quality wants to spot users iterating on the same intent.", task: "Return the user_id and count of searches for users who ran the SAME query more than once (same query text).", output: "user_id, query, times", rules: "GROUP BY user_id, query. HAVING COUNT(*) > 1.", answer: "SELECT user_id, query, COUNT(*) AS times FROM searches GROUP BY user_id, query HAVING COUNT(*) > 1 ORDER BY times DESC;", hint: "GROUP BY on two columns + HAVING.", solution: "SELECT user_id, query, COUNT(*) AS times FROM searches GROUP BY user_id, query HAVING COUNT(*) > 1;" },
    { id: "goo-h-1", difficulty: "advanced", title: "Top-paid per org", context: "People Ops wants the highest-paid employee per org for a review committee.", task: "For each org return name and salary of the top-paid employee. Use ROW_NUMBER partitioned by org.", output: "org, name, salary", rules: "PARTITION BY org ORDER BY salary DESC, keep rn = 1.", answer: "SELECT org, name, salary FROM (SELECT org, name, salary, ROW_NUMBER() OVER (PARTITION BY org ORDER BY salary DESC) AS rn FROM employees) t WHERE rn = 1 ORDER BY salary DESC;", hint: "Classic top-N-per-group.", solution: "SELECT org, name, salary FROM (SELECT org, name, salary, ROW_NUMBER() OVER (PARTITION BY org ORDER BY salary DESC) AS rn FROM employees) t WHERE rn = 1 ORDER BY salary DESC;" },
    { id: "goo-h-2", difficulty: "advanced", title: "Ad revenue per user", context: "Payments wants to know how much revenue Ads generates per user shown at least one impression.", task: "Return user_id and total ad cost (SUM(cost)) for users who saw at least 2 impressions. Order desc.", output: "user_id, revenue", rules: "GROUP BY user_id, HAVING COUNT(*) >= 2, SUM(cost) as revenue.", answer: "SELECT user_id, SUM(cost) AS revenue FROM ad_impressions GROUP BY user_id HAVING COUNT(*) >= 2 ORDER BY revenue DESC;", hint: "Aggregate + HAVING.", solution: "SELECT user_id, SUM(cost) AS revenue FROM ad_impressions GROUP BY user_id HAVING COUNT(*) >= 2 ORDER BY revenue DESC;" },
  ],
};

// ============ META ============
export const META = {
  key: "meta",
  name: "Meta",
  tagline: "Facebook · Instagram · Growth",
  color: "#1877F2",
  logo: "🌐",
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
