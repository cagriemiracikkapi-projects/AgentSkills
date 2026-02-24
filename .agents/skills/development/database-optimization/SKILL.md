---
name: development/database-optimization
description: Deep strategies for ACID compliance, Indexing, caching, and fixing N+1 queries.
---

# Skill: Database Optimization

Use this skill when dealing with ORMs, SQL queries, or NoSQL data modeling.

## Capabilities
- Designing robust relational schemas (Normalization up to 3NF).
- Utilizing Eager Loading to resolve N+1 transaction loops.
- Recommending correct Index types (B-Tree, Hash, GIN).
- Implementing caching layers (Redis/Memcached).

## Core Rule
Never run database queries inside loops. Always prepare parameters to prevent SQL injection.
