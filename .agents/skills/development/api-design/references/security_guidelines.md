# API Security & Rate Limiting Guidelines

## Overview
This reference guide establishes the hard rules for securing exposed REST and GraphQL endpoints against OWASP Top 10 vulnerabilities, brute-force attacks, and scraping.

## 1. Authentication & Authorization

### Rule: Always use strict JWTs (JSON Web Tokens) or Secure HttpOnly Cookies
Stateful sessions via memory (e.g., Express-Session) break horizontal scaling.

**Implementation Logic:**
- **Access Tokens:** Short-lived (15-60 minutes). Used as Bearer tokens in the `Authorization` header.
- **Refresh Tokens:** Long-lived (7-30 days). Stored as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to prevent XSS exfiltration.

**Anti-Pattern:** Storing JWTs in `localStorage`. If an attacker finds an XSS vulnerability, they can steal the token instantly using `window.localStorage.getItem()`.

## 2. Rate Limiting (Token Bucket / Leaky Bucket)

Never expose a public endpoint without a Rate Limit. Attackers will brute force logins or scrape entire databases.

### Recommended Limits:
- **Public GET Endpoints (Search, Catalog):** 100 requests / 1 minute / IP.
- **Authenticated GET Endpoints:** 300 requests / 1 minute / User ID.
- **Sensitive POST Endpoints (Login, Reset Password):** 5 requests / 5 minutes / IP.

### Implementation Pattern (Redis):
Use a Token Bucket algorithm backed by Redis. When a user hits the threshold, return `429 Too Many Requests` with a `Retry-After` header indicating when they can try again.

## 3. WebHook Security (HMAC Validation)

When accepting webhooks from external providers (e.g., Stripe, PayPal, GitHub), you MUST verify that the payload hasn't been tampered with or sent by a malicious actor.

**Implementation Logic:**
1. Provide the 3rd party with a cryptographic Secret Key.
2. The 3rd party signs the request body using HMAC-SHA256 and sends the signature in a Header (e.g., `Stripe-Signature`).
3. Your API recalculates the HMAC-SHA256 hash using the raw request body and your stored Key.
4. If the hashes match, the payload is authentic. If not, return `401 Unauthorized` and log the attempt.

## 4. Input Validation & Error Handling

Never trust the client. A request stating `isAdmin: true` should be filtered out immediately if the endpoint is not designed to handle permission changes.

### Rule: Validate at the Edge
Use libraries like `Joi` (Node) or `Pydantic` (Python) to define strict schemas. If a request includes a field not defined in the schema, it must be stripped (Whitelist approach), or the request should be violently rejected (Strict approach).

### Rule: Sanitize Error Messages
Do not return stack traces or raw database error strings to the client. Attackers use these to map out your internal database structure.

**Bad Response:**
```json
{ "error": "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'admin@test.com' for key 'users_email_unique'" }
```

**Good Response:**
```json
{ "error": "A user with this email already exists." }
```
