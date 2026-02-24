# Database Scalability & ACID Compliance

## Overview
When a database grows from 10 GB to 1 TB, simple indexing is no longer enough. This reference outlines architectural patterns for horizontally scaling your persistence layer while maintaining data integrity.

## 1. Connection Pooling

Opening and closing a TCP connection to PostgreSQL is incredibly slow and CPU intensive.

### Rule: Never open direct connections in serverless environments.
AWS Lambda or Vercel Edge functions can spawn 1,000 parallel instances in a second. This will immediately trigger a "Too many connections" fatal error on your database.

**The Fix:** 
Place a connection pooler (like `PgBouncer` or AWS RDS Proxy) between the application and the database. The pooler maintains a small set of persistent connections to the DB (e.g., 50) and routes the thousands of app queries through them.

## 2. Read Replicas vs Sharding

### Read Replicas (Vertical/Scale-Up):
- **Concept:** One Primary Database (receives all `INSERT`/`UPDATE` writes). Multiple Read-Only Replica databases (receives only `SELECT` reads).
- **Use Case:** Systems where 90% of traffic is reads (Blogs, E-commerce Catalogs).
- **Problem:** Replication Lag. If a user updates their profile and immediately refreshes the page, the replica might not have the new data yet (Eventual Consistency).

### Sharding (Horizontal Partitioning):
- **Concept:** Splitting the massive `users` table across multiple separate database servers based on a Hash Key (e.g., Users A-M on Server 1, N-Z on Server 2).
- **Use Case:** Multi-tenant SaaS, gigantic datasets that literally cannot fit on one hard drive.
- **Problem:** `JOIN` operations across different shards are nearly impossible or incredibly slow.

## 3. Concurrency Control (Locking)

When two users try to buy the last ticket to a concert at the exact same millisecond, you must handle the collision carefully.

### Pessimistic Locking (Row-level Locking)
```sql
BEGIN;
SELECT * FROM tickets WHERE id = 1 FOR UPDATE;
-- Application logic runs here. No one else can read/write this ticket until COMMIT
UPDATE tickets SET status = 'sold' WHERE id = 1;
COMMIT;
```
- **Pros:** Absolute safety.
- **Cons:** Slow. Causes connection bottlenecks if held too long. Leads to Deadlocks.

### Optimistic Locking (Version Numbers)
Add a `version` column to the table.
```sql
SELECT id, status, version FROM tickets WHERE id = 1; -- Returns version 3
```
When updating, the application explicitly asserts the version hasn't changed.
```sql
UPDATE tickets 
SET status = 'sold', version = 4 
WHERE id = 1 AND version = 3;
```
- **If Rows Affected = 1:** Success.
- **If Rows Affected = 0:** Someone else bought it first. The application catches this and tells the user.
- **Pros:** Extremely fast and lock-free. Perfect for high-concurrency web APIs.

## 4. Understanding ACID Transactions

**A** - Atomicity: All parts of a transaction succeed, or the entire thing rolls back. (No half-processed payments).
**C** - Consistency: The transaction must result in a valid state adhering to all Foreign Keys and Constraints.
**I** - Isolation: Concurrent transactions do not affect each other.
**D** - Durability: Once a transaction commits, it is permanently saved to disk, even if the power dies a millisecond later.

If you don't need ACID guarantees (e.g., storing tracking clicks, session logs, caching), use a NoSQL or Key-Value store like Redis or DynamoDB instead to save relational DB resources.
