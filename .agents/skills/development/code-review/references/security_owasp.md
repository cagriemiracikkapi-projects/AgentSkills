# Security & OWASP Top 10

## Overview
This reference guide covers the absolute minimum security requirements that must be enforced during Code Review before a PR can be merged into the `main` branch.

## 1. Injection (SQL, NoSQL, OS Command)

Untrusted data must never be concatenated directly into an interpreter.

### SQL Injection
**Anti-Pattern:**
```javascript
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
await db.query(query); // If email is "admin' OR '1'='1", entire database is exposed.
```
**Fix (Parameterization / Prepared Statements):**
```javascript
const query = `SELECT * FROM users WHERE email = ?`;
await db.query(query, [req.body.email]);
```

### OS Command Injection
Never pass user input directly to `exec()` or `spawn()`.

## 2. Cross-Site Scripting (XSS)

XSS occurs when an application includes untrusted data in a web page without proper validation or escaping. If an attacker injects `<script>...</script>` into a blog comment, every person who reads that blog will execute the attacker's script.

### Mitigation:
- **Frameworks are normally safe:** React, Angular, and Vue automatically escape output by default (`<div>{userContent}</div>` is safe).
- **The Danger Zone:** Reviewers MUST flag any use of `dangerouslySetInnerHTML` (React), `v-html` (Vue), or raw `.innerHTML` allocations in vanilla JS.
- **Content Security Policy (CSP):** Ensure the application sends a CSP HTTP header that forbids the execution of inline scripts (`script-src 'self'`).

## 3. Broken Authentication & Session Management

Session tokens (JWTs or traditional cookies) are equivalent to user passwords. If stolen, the attacker IS the user.

### Cookie Configuration For Web Apps:
- `HttpOnly`: True. (Prevents Javascript from reading the token, neutralizing XSS exfiltration).
- `Secure`: True. (Cookie is only sent over HTTPS).
- `SameSite`: Strict or Lax. (Prevents the token from being sent in cross-site requests, mitigating CSRF).

### JWT (JSON Web Token) Rules:
- Never store sensitive data (SSN, Passwords, full addresses) inside the JWT payload. Anyone can Base64 decode a JWT.
- Use a strong, rotated secret key (`HS256`) or asymmetric keys (`RS256`).

## 4. Cross-Site Request Forgery (CSRF)

CSRF is an attack that forces an end user to execute unwanted actions on a web application in which they're currently authenticated.

### Mitigation:
- **SameSite Cookies:** See above. This is the primary modern defense.
- **Anti-CSRF Tokens:** If `SameSite` isn't fully supported or sufficient, the server must issue a unique, cryptographically strong hidden token inside every form (`<input type="hidden" name="csrf_token" value="...">`), and validate it on POST.
