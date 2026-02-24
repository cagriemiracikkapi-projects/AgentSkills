---
name: development/database-optimization
description: Complete toolkit for analyzing database performance, resolving N+1 queries, planning index strategies, and migrating schemas safely. Use this skill when ORM queries are slow, database CPU is spiking, or when designing relationships for high-traffic environments.
---

# Skill: Database Optimization

Comprehensive architectural guidelines and tools for building and maintaining performant SQL and NoSQL databases.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Slow Query Analyzer
python .agent_scripts/development_database-optimization/slow_query_analyzer.py [options]

# Script 2: Index Recommender
python .agent_scripts/development_database-optimization/index_recommender.py [options]

# Script 3: Schema Migration Validator
python .agent_scripts/development_database-optimization/migration_validator.py [options]
```

## Core Capabilities

### 1. Slow Query Analyzer

Automated tool to parse database logs (e.g., pg_stat_statements) or ORM logs and identify the most expensive queries.

**Features:**
- Identifies N+1 query patterns in ORM output
- Highlights queries missing WHERE clause indexes
- Calculates total time cost vs average execution time

**Usage:**
```bash
python .agent_scripts/development_database-optimization/slow_query_analyzer.py --log-file pg_slow.log --threshold 500ms
```

### 2. Index Recommender

Analyzes a specific table schema and a provided complex query, then recommends the optimal index (B-Tree, Hash, GIN) to satisfy the query's WHERE, JOIN, and ORDER BY clauses.

**Features:**
- Suggests Composite Indexes for multi-column filtering
- Identifies redundant or overlapping indexes
- Recommends Partial Indexes for boolean flags (e.g., `is_deleted = false`)

**Usage:**
```bash
python .agent_scripts/development_database-optimization/index_recommender.py --table users --query "SELECT * FROM users WHERE status='active' AND created_at > '2023-01-01' ORDER BY last_login DESC"
```

### 3. Schema Migration Validator

Lints migration files (e.g., Prisma, Flyway, Alembic) before they run in production to catch operations that will lock the table and cause downtime.

**Features:**
- Warns against adding columns with DEFAULT values on large tables (without `CONCURRENTLY`)
- Checks for destructive operations (DROP COLUMN)
- Validates foreign key constraints don't block inserts

**Usage:**
```bash
python .agent_scripts/development_database-optimization/migration_validator.py ./migrations/
```

## Reference Documentation

### Query Optimization & Indexing

Comprehensive guide available in `references/query_optimization.md`:

- Eliminating N+1 Queries (Eager Loading vs DataLoader)
- B-Tree vs Hash vs GIN indexing strategies
- Understanding `EXPLAIN ANALYZE` output
- The danger of `SELECT *` and Over-fetching

### Scalability & ACID Compliance

Technical reference guide in `references/scalability_patterns.md`:

- Read Replicas vs Sharding (Horizontal Partitioning)
- Connection Pooling best practices (PgBouncer)
- Optimistic vs Pessimistic Concurrency Control (Locking)
- Denormalization tradeoffs for read-heavy hotspots

## Tech Stack

**Databases:** PostgreSQL, MySQL, MongoDB, Redis, DynamoDB
**ORMs:** Prisma, TypeORM, Entity Framework, SQLAlchemy, GORM
**Tools:** PgBouncer, DataGrip, EXPLAIN
**Concepts:** ACID, CAP Theorem, Sharding, Replication

## Development Workflow

### 1. Diagnosis
Never guess what is slow. Measure it.
- Run `EXPLAIN ANALYZE` on the suspected query.
- Use `.agent_scripts/development_database-optimization/slow_query_analyzer.py` to find the mathematical bottleneck.

### 2. Resolution
- Add indexes via `.agent_scripts/development_database-optimization/index_recommender.py`.
- If an index isn't enough, refactor the application layer to use Redis Caching or DataLoaders.

### 3. Safe Deployment
- Write the migration script.
- Run `.agent_scripts/development_database-optimization/migration_validator.py` to ensure applying the index won't lock the `users` table for 10 minutes during peak hours.

## Best Practices Summary

### Query Writing
- Avoid leading wildcards in `LIKE` queries (`LIKE '%term'`) as they prevent index usage.
- Use `EXISTS` instead of `COUNT() > 0` to check for presence.

### Connections
- Always use a Connection Pooler (PgBouncer) in serverless environments (AWS Lambda, Vercel).
- Release connections back to the pool immediately after the transaction ends.

## Troubleshooting

### High Database CPU
- 90% of the time, this is caused by missing indexes resulting in Sequential Scans (Full Table Scans) for every request.
- Use the Slow Query Analyzer to find the culprit.

## Resources

- Query Optimization: `references/query_optimization.md`
- Scalability Patterns: `references/scalability_patterns.md`
- Utilities: `.agent_scripts/development_database-optimization/` directory
