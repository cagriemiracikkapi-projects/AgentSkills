---
name: development/code-review
description: Comprehensive toolkit for performing static analysis, identifying OWASP vulnerabilities, evaluating algorithmic complexity, and conducting architectural reviews. Use when analyzing Pull Requests or searching for technical debt.
---

# Skill: Security & Code Review

Guidelines and tools for conducting ruthless, objective code audits and security assessments.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: OWASP Vulnerability Scanner
node .agent_scripts/development_code-review/owasp_scanner.js [options]

# Script 2: Complexity & Smells Analyzer
python .agent_scripts/development_code-review/complexity_analyzer.py [options]

# Script 3: Architecture Dependency Mapper
python .agent_scripts/development_code-review/arch_dependency_mapper.py [options]
```

## Core Capabilities

### 1. OWASP Vulnerability Scanner

Performs a lightweight static analysis focusing strictly on the OWASP Top 10 vulnerabilities (Injection, Broken Authentication, XSS).

**Features:**
- Identifies raw SQL concatenation (SQLi)
- Flags `dangerouslySetInnerHTML` in React applications (XSS)
- Warns of hardcoded JWT secrets or primitive cryptography (MD5/SHA1)

**Usage:**
```bash
node .agent_scripts/development_code-review/owasp_scanner.js ./src/controllers/
```

### 2. Complexity & Smells Analyzer

Calculates Cyclomatic Complexity to identify "Arrow Code" and God Classes that are impossible to test.

**Features:**
- Flags methods longer than 60 lines
- Flags control structures nested deeper than 3 levels
- Identifies copy-pasted (DRY violation) code blocks

**Usage:**
```bash
python .agent_scripts/development_code-review/complexity_analyzer.py --threshold 15 ./src/services/
```

### 3. Architecture Dependency Mapper

Scans imports to ensure the application layer isn't tightly coupled to the persistence layer, violating Hexagonal Architecture principles.

**Features:**
- Warns if UI components are importing Database ORMs directly
- Identifies circular dependencies
- Visualizes the dependency tree

**Usage:**
```bash
python .agent_scripts/development_code-review/arch_dependency_mapper.py ./src/
```

## Reference Documentation

### Security & OWASP Guidelines

Comprehensive guide available in `references/security_owasp.md`:

- Mitigation techniques for XSS and CSRF
- Input Validation (Whitelist vs Blacklist)
- Secure session token management (`HttpOnly`, `SameSite`)

### Clean Code & SOLID Refactoring

Technical reference guide in `references/clean_code.md`:

- Applying the Single Responsibility Principle (SRP)
- Refactoring "Deep Nesting" using Guard Clauses (Early Returns)
- Eliminating Magic Numbers and Strings

## Tech Stack

**Tools:** SonarQube, Snyk, ESLint, Bandit (Python)
**Methodologies:** SOLID, OWASP Top 10, DRY, YAGNI

## Development Workflow (The Review Process)

### 1. Read for Security First
Assume all input is malicious.
- Look for where user input enters the system (`req.body`, `req.query`, `argv`). 
- Trace that input. Is it validated? Is it sanitized before hitting the database or the DOM?

### 2. Read for Architecture Second
Does this code belong here?
- If a Controller is formatting a Date string to "MM/DD/YYYY", it is violating SRP. That logic belongs in a presentation utility function.

### 3. Read for Performance Third
Will this scale?
- Look for database queries inside of `for` loops.
- Look for arrays being copied by value instead of passed by reference.

## Best Practices Summary

### PR Etiquette
- Be objective. Say "This SQL query lacks parameterization" instead of "You wrote a dangerous query."
- Ask questions. "What happens if this external API times out here?"

### Guard Clauses
Never nest logic if you don't have to.
```javascript
// BAD: Arrow Code
if (user != null) {
  if (user.isAdmin) {
    if (user.balance > 0) {
      // do something
    }
  }
}

// GOOD: Guard Clauses
if (user == null) return false;
if (!user.isAdmin) return false;
if (user.balance <= 0) return false;
// do something
```

## Resources

- Security Guide: `references/security_owasp.md`
- Clean Code Strategies: `references/clean_code.md`
- Utilities: `.agent_scripts/development_code-review/` directory
