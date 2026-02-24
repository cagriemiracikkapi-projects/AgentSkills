# Clean Code & SOLID Principles

## Overview
Code is read 10x more often than it is written. This reference outlines the structural code smells that Reviewers must identify and reject during PR reviews.

## 1. Cyclomatic Complexity & The Arrow Code Anti-Pattern

Cyclomatic Complexity measures the number of linearly independent paths through a program's source code. In simple terms: How many `if`, `else`, `while`, and `switch` statements are in this function?

**Rule:** A single function should never exceed a complexity score of 10.

### FIX: Guard Clauses (Early Returns)
If your code forms the shape of an arrow (`>`), it is unreadable.

**Bad:**
```javascript
function processOrder(order) {
    if (order != null) {
        if (order.status === 'PENDING') {
            if (order.items.length > 0) {
                // 100 lines of complex processing
                return true;
            } else {
                throw new Error("Empty order");
            }
        } else {
            throw new Error("Invalid status");
        }
    }
}
```

**Good:**
```javascript
function processOrder(order) {
    if (order == null) return false;
    if (order.status !== 'PENDING') throw new Error("Invalid status");
    if (order.items.length === 0) throw new Error("Empty order");
    
    // 100 lines of complex processing un-indented
    return true;
}
```

## 2. The Single Responsibility Principle (SRP)

A class or module should have one, and only one, reason to change.

### The Smell: The God Class
If `UserService.ts` handles hashing passwords, firing welcome emails, rendering PDF invoices, and saving to the database, it has 4 reasons to change.

### The Fix: Dependency Injection
Break it apart. `UserService` should accept `IEmailClient` and `IPdfRenderer` through its constructor.

## 3. Magic Numbers and Strings

Reviewers MUST reject PRs containing hardcoded, unexplained primitives.

**Bad:**
```javascript
if (user.role === 1 && user.status === 2) {
    setTimeout(disconnect, 86400000);
}
```

**Good:**
```javascript
const ROLES = { ADMIN: 1 };
const STATUS = { ACTIVE: 2 };
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

if (user.role === ROLES.ADMIN && user.status === STATUS.ACTIVE) {
    setTimeout(disconnect, ONE_DAY_MS);
}
```

## 4. Meaningful Naming (Boolean Traps)

Booleans passed as arguments to functions are considered an anti-pattern because the caller's code becomes unreadable without an IDE hover.

**Bad (The Caller):**
```javascript
user.save(true, false); // What do these mean?
```

**Good (Use Configuration Objects):**
```javascript
user.save({ sendEmail: true, bypassValidation: false });
```

### Verb Prefixes
Functions should start with verbs. Variables should be nouns. Booleans should ask a question.
- **Arrays:** `users` (not `userList`)
- **Booleans:** `isActive`, `hasPermission`, `canDelete` (not `active`, `permission`)
- **Functions:** `fetchUsers()`, `calculateTotal()` (not `users()`, `total()`)
