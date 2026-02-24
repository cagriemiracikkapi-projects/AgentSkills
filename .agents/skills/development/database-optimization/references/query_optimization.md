# Database Query Optimization & Indexing

## Overview
This reference guide establishes the hard rules for writing performant queries and designing schemas that scale. Poorly optimized queries are the #1 cause of API latency and server crashes.

## 1. N+1 Query Elimination

The N+1 problem occurs when an application executes 1 query to fetch a list of N items, and then executes N additional queries to fetch related data for each item. 
Total Queries = 1 + N.
If N is 100, you are making 101 database statements instead of 1.

**Anti-Pattern (N+1):**
```javascript
// BAD: Loop inside application code
const users = await db.query('SELECT * FROM users LIMIT 100');
for (const user of users) {
  // Executed 100 times!
  user.posts = await db.query(`SELECT * FROM posts WHERE user_id = ${user.id}`);
}
```

**Resolution (Eager Loading / Joins):**
```javascript
// GOOD: Fetch all at once
const usersWithPosts = await db.query(`
  SELECT u.*, p.* 
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  WHERE u.id IN (...)
`);
```

**Resolution (DataLoader for GraphQL):**
Use `DataLoader` to batch and deduplicate queries occurring across different resolvers in the same tick.

## 2. Indexing Strategies

Indexes dramatically speed up `SELECT` statements at the cost of slightly slower `INSERT` / `UPDATE` statements (and extra disk space).

### The Primary Rule:
If a column is frequently used in a `WHERE`, `JOIN`, or `ORDER BY` clause, it MUST be indexed.

### Types of Indexes:
- **B-Tree (Default):** The standard. Excellent for equality (`=`) and range (`<`, `>`, `BETWEEN`) queries.
  - Example: `CREATE INDEX idx_users_email ON users(email);`
- **Hash:** Only good for exact equality checks. Smaller memory footprint than B-Tree, but useless for sorting or ranges.
- **GIN (Generalized Inverted Index):** Vital for searching within JSONB columns or Full-Text Search in Postgres.
  - Example: `CREATE INDEX idx_products_tags ON products USING GIN (tags);`

### Composite Indexes (Left-Prefix Rule):
If you query by `WHERE status = 'active' AND type = 'premium'`, a composite index on `(status, type)` is optimal.
**Rule:** The database can only use the index if the query filters from Left to Right. A query for `WHERE type = 'premium'` CANNOT use the `(status, type)` index efficiently.

### Partial Indexes:
If you have millions of 'deleted' records and only care about 'active' ones, create a partial index to save memory.
```sql
CREATE INDEX idx_active_users ON users(email) WHERE is_deleted = false;
```

## 3. The Danger of `SELECT *` (Over-fetching)

Never use `SELECT *` in production code.

1. **Network IO:** Sending 50 columns of data when you only need `id` and `name` saturates the network connection.
2. **Memory Limit:** Node.js or Python must allocate memory to deserialize every single field.
3. **Index-Only Scans:** If you only `SELECT id, name` and both are part of an index, the database can return the result *entirely from the index* without ever hitting the actual table on disk. `SELECT *` destroys this optimization.

## 4. `EXISTS` vs `COUNT()`

When checking if a record exists, NEVER use `COUNT()`. `COUNT()` forces the database to scan the table to find the exact number. `EXISTS` stops scanning the exact millisecond it finds the 1st match.

**Bad:**
```sql
SELECT COUNT(*) FROM orders WHERE user_id = 123;
-- App checks if count > 0
```

**Good:**
```sql
SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = 123);
```
