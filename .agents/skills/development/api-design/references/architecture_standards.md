# API Architecture & Payload Standards

## Overview
This reference guide establishes the foundational rules for designing robust, scalable, and predictable APIs. Adherence to these patterns prevents integration friction between frontend and backend teams.

## 1. RESTful Resource Routing

### Rule: Use Plural Nouns, Not Verbs
APIs should represent resources, not actions. Use HTTP verbs to define the action.

**Anti-Pattern:**
```http
POST /api/createNewUser
GET /api/getAllArticles
```

**Best Practice:**
```http
POST /api/users
GET /api/articles
```

### Rule: Resource Nesting
Limit nesting to one level deep to avoid complex and fragile URLs.
**Good:** `/users/123/posts`
**Bad:** `/users/123/posts/456/comments/789` (Instead, use `/posts/456/comments` or `/comments/789`)

## 2. Standardized Response Envelopes

To provide consistent data parsing for frontend clients, all responses (success and error) should conform to a strict envelope structure. Do not return raw arrays or naked objects.

```typescript
// Standard Success Payload
{
  "data": { ... },       // The requested resource or array of resources
  "meta": {              // Optional metadata (pagination, cursors, build info)
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "error": null          // Always null on 2xx responses
}

// Standard Error Payload (RFC 7807 loosely implemented)
{
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided email address is invalid.",
    "details": [
      { "field": "email", "issue": "Must be a valid email format." }
    ]
  }
}
```

## 3. Idempotency

All mutating endpoints (POST, PUT, PATCH, DELETE) that perform critical operations (e.g., charging a credit card, creating an order) MUST be idempotent to handle network retries gracefully.

**Implementation Logic:**
1. The client generates a unique UUID (e.g., `Idempotency-Key: 8a93j2-39dk...`) and sends it in the Header.
2. The Backend checks a fast cache (Redis) to see if this key was processed recently.
3. If it exists, return the cached HTTP response and status code immediately, without hitting the database.
4. If it doesn't exist, process the request normally, and cache the final response against that key for 24 hours.

## 4. Pagination (Cursor vs. Offset)

### Offset Pagination (Use for small, static datasets)
Uses `?limit=20&offset=40`.
- **Pros:** Easy to implement, allows jumping to page 5 directly.
- **Cons:** Extremely slow on large datasets (`OFFSET 10000` requires the database to scan and discard 10,000 rows). Real-time data insertion causes items to shift pages.

### Cursor Pagination (Use for Infinite Scroll & Large datasets)
Uses `?limit=20&cursor=eyJpZCI6MTUwfQ==`.
- **Pros:** Database uses an index to leap exactly to the cursor location (`WHERE id > 150`). Extremely fast and resilient to real-time data changes.
- **Cons:** Harder to implement. Users cannot jump randomly to "Page 10".

## 5. Caching Strategy
Always leverage HTTP Caching headers to offload repetitive reads from the database.
- `ETag`: Allow clients to determine if data has changed without downloading the full payload.
- `Cache-Control: public, max-age=3600`: Use for completely public data (e.g., product catalog).
- `Cache-Control: private, no-cache`: Use for sensitive, user-specific data.
