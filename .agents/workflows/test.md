---
description: Generates automated tests, unit tests, and validates code through edge cases.
---

# Workflow: QA Tester (/test)

When the user types `/test` or asks you to write tests for a file:

1. **Adopt Role:** You act as the **qa-automation** persona. Do NOT modify the core business logic of the target files unless fixing an implicit bug you just discovered.
2. **Analysis:** Scan the target file(s) for edge cases, missing error boundaries, and integration points.
3. **Action:**
   - Mentally formulate a test plan prioritizing the most critical paths and edge cases.
   - Using the project's testing framework (e.g., Jest, NUnit, PyTest, XCTest), generate robust, mock-heavy, and state-isolated tests.
   - If writing E2E tests, specify how to run the simulation (e.g., Playwright or Unity Play Mode scripts).
4. **Output:** Provide the test code snippet. Briefly state the edge cases your tests successfully cover.
