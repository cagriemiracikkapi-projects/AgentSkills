---
name: development/qa-testing
description: Complete toolkit for establishing Test-Driven Development (TDD) pipelines, structuring test suites, and isolating dependencies with Mocks. Use when refactoring fragile code, building CI/CD test gates, or setting up Cypress/Playwright End-to-End tests.
---

# Skill: QA Testing & TDD

Comprehensive guidelines and tools for building deterministic, fast, and resilient automated test suites.

## Quick Start

> **Script Paths:** Gemini/Codex/cursorlike: `.agent_scripts/development_qa-testing/`. Claude (folder mode): `.claude/skills/development/qa-testing/scripts/`.

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: TDD Unit Test Boilerplate Generator
node .agent_scripts/development_qa-testing/tdd_generator.js [options]

# Script 2: Test Suite Flakiness Analyzer
node .agent_scripts/development_qa-testing/flakiness_analyzer.js [options]

# Script 3: E2E Page Object Scaffolder
node .agent_scripts/development_qa-testing/e2e_page_object.js [options]
```

## Core Capabilities

### 1. TDD Boilerplate Generator

Generates a foundational Jest/Pytest test file based on a class name, automatically stubbing out the "Arrange, Act, Assert" blocks.

**Features:**
- Implements standard `beforeEach` fixture reset blocks
- Configures mock injection boundaries
- Generates "Happy Path" and "Exception" stubs

**Usage:**
```bash
node .agent_scripts/development_qa-testing/tdd_generator.js PaymentService --target unit
```

### 2. Flakiness Analyzer

Parses CI test output logs over the last 10 runs to identify tests that randomly pass and fail without code changes.

**Features:**
- Identifies tests reliant on static `sleep()` calls instead of dynamic polling
- Highlights possible test-pollution (state leaked between tests)
- Warns about tests reliant on external live network APIs

**Usage:**
```bash
node .agent_scripts/development_qa-testing/flakiness_analyzer.js ./ci-logs/ --format json
```

### 3. E2E Page Object Scaffolder

Generates Page Object Model (POM) classes for Cypress/Playwright to keep End-to-End tests DRY and maintainable.

**Features:**
- Generates standard getters based on `data-testid` attributes
- Encapsulates common page interactions (e.g., `login(user, pass)`)
- Separates test execution from DOM selection

**Usage:**
```bash
node .agent_scripts/development_qa-testing/e2e_page_object.js LoginForm --framework cypress
```

## Reference Documentation

### TDD & Mocking Strategy

Comprehensive guide available in `references/tdd_and_mocking.md`:

- The Red-Green-Refactor cycle
- Differentiating Mocks, Stubs, and Spies
- Dealing with time dependencies (Fake Timers)

### E2E Testing Patterns

Technical reference guide in `references/e2e_best_practices.md`:

- Why you should NEVER select elements using CSS class names
- Implementing the Page Object Model (POM)
- Seeding and wiping the database for E2E isolation

## Tech Stack

**Frameworks:** Jest, Vitest, Pytest, xUnit, Cypress, Playwright
**Concepts:** TDD, BDD, AAA (Arrange, Act, Assert), Dependency Injection
**CI/CD Integration:** GitHub Actions, SonarQube

## Development Workflow

### 1. Define the Boundary (Unit Testing)
- Identify the single function to test. 
- Do not connect to a real database. Mock the `IUserRepository` to instantly return a dummy user.

### 2. Isolate the Test (Arrange, Act, Assert)
```javascript
// Arrange
const repository = new MockRepository();
const service = new PaymentService(repository);
// Act
const result = await service.charge(100);
// Assert
expect(result.status).toBe('success');
```

### 3. Build End-to-End Confidence
After unit tests cover the logic, use Cypress/Playwright to visually click through the UI, interacting only with robust `data-testid="submit-btn"` selectors to ensure the backend and frontend are truly connected.

## Best Practices Summary

### Determinism
- A test should produce the EXACT same result whether run 1 time or 10,000 times in a row.
- If a test connects to a live production API, it is NOT a unit test. It is a fragile script.

### Naming
- Use descriptive sentences for test names: `it('throws_ValidationError_when_email_is_missing')` instead of `it('tests email validation')`.

## Troubleshooting

### Test passes locally, but fails in GitHub Actions (CI)
- You likely have timezone issues (using `new Date()` instead of a mocked Date).
- You might have a race condition where CI runs tests in parallel, and Test A deletes the database record that Test B requires.

## Resources

- TDD Strategy: `references/tdd_and_mocking.md`
- E2E Patterns: `references/e2e_best_practices.md`
- Utilities: `.agent_scripts/development_qa-testing/` directory
