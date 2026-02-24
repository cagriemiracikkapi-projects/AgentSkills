---
name: development/api-design
description: Complete toolkit for architecting scalable, resilient, and secure REST/GraphQL APIs. Includes idempotency patterns, pagination standards, and error handling envelopes. Use this skill when scaffolding new API routes, optimizing network payloads, or establishing service-to-service communication contracts.
---

# Skill: API Design

Comprehensive architectural guidelines and tools for building enterprise-grade backend APIs.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: API Route Scaffolder
python scripts/api_route_scaffolder.py [options]

# Script 2: OpenAPI/Swagger Generator
python scripts/openapi_generator.py [options]

# Script 3: Endpoint Load Tester
python scripts/endpoint_load_tester.py [options]
```

## Core Capabilities

### 1. API Route Scaffolder

Automated tool for generating boilerplate controllers, services, and routing definitions adhering to strict RESTful standards.

**Features:**
- Automatic DTO (Data Transfer Object) generation
- Configurable Joi/Zod validation schemas
- Integrated standardized `{ data, error, meta }` envelopes
- Boilerplate Jest/Supertest integration tests

**Usage:**
```bash
python scripts/api_route_scaffolder.py <route-name> --method [GET|POST|PUT|DELETE]
```

### 2. OpenAPI Generator

Scans existing controllers and comments to automatically build or update `swagger.json` or `openapi.yaml` specifications.

**Features:**
- Static code analysis for route extraction
- Automatic type inference for schema generation
- Identifies undocumented query parameters

**Usage:**
```bash
python scripts/openapi_generator.py <src-folder> --output swagger.json
```

### 3. Endpoint Load Tester

A lightweight wrapper around `k6` or `autocannon` to quickly stress-test specific endpoints for concurrency limits and N+1 query bottlenecks.

**Features:**
- Simulates 100-1000 concurrent virtual users
- Measures p95 and p99 latency percentiles
- Identifies memory leaks under sustained load

**Usage:**
```bash
python scripts/endpoint_load_tester.py <endpoint-url> --users 100 --duration 60s
```

## Reference Documentation

### Architecture & Payload Standards

Comprehensive guide available in `references/architecture_standards.md`:

- REST vs GraphQL decision matrix
- Standardized Error Envelopes (RFC 7807 Problem Details)
- Implementing Cursor-based vs Offset-based Pagination
- Idempotency implementation guidelines (Idempotency-Key headers)

### Security & Rate Limiting

Technical reference guide in `references/security_guidelines.md`:

- Token-based Authentication (JWT, Refresh Tokens)
- Implementing Leaky Bucket / Token Bucket algorithms
- OWASP API Security Top 10 mitigation
- Securing WebHook endpoints using HMAC signature validation

## Tech Stack

**Languages:** Python, TypeScript, Go, Java
**Frameworks:** Express.js, NestJS, FastAPI, Gin, Spring Boot
**Documentation:** Swagger, OpenAPI 3.0, GraphQL Playground
**Testing:** Supertest, Jest, k6, Autocannon

## Development Workflow

### 1. Planning the Contract
Never write code before the contract is agreed upon.
- Define the Request/Response payloads using OpenAPI or GraphQL schemas.
- Ensure the Frontend teams sign off on the required fields to avoid Under/Over-fetching.

### 2. Scaffold and Implement
```bash
# Generate the boilerplate
python scripts/api_route_scaffolder.py users --method POST

# Implement the business logic following references/architecture_standards.md
```

### 3. Load Testing & Hardening
```bash
# Verify the endpoint can handle production traffic
python scripts/endpoint_load_tester.py http://localhost:3000/api/v1/users --users 50
```

## Best Practices Summary

### Consistency
- Use Plural Nouns for resources (`/users`, not `/user`).
- Never put verbs in the URL unless it's a specific action RPC (`/users/123/activate`).
- Always return standard HTTP Status Codes (201 Created, 400 Bad Request, 403 Forbidden).

### Performance
- Compress responses using Gzip or Brotli.
- Utilize standard Cache-Control headers (`ETag`, `Last-Modified`) for GET requests.
- Prevent N+1 queries by pushing aggregation directly into the Database layer.

## Troubleshooting

### Unexplained Latency Spikes
- Check if missing Database indexes are causing Full Table Scans.
- Verify that 3rd party API calls are not blocking the main thread (Node.js).
- Review `references/security_guidelines.md` for proper connection pool sizing.

## Resources

- Architecture Guidance: `references/architecture_standards.md`
- Security Guidelines: `references/security_guidelines.md`
- Utilities: `scripts/` directory
