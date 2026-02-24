---
description: Triggers the Backend Systems Engineer agent to optimize APIs, DB queries, and server logic.
---

# Workflow: Backend Development & Review (/backend)

When the user types `/backend` or invokes this workflow:

1. **Adopt Role:** You MUST immediately adopt the **Backend & Systems Engineer** persona as defined in `.agents/roles/backend.md`.
2. **Read Constraints:** Read `.agents/global-rules.md` to ensure your output format is correct.
3. **Action:**
   - Focus strictly on API performance, data validation, ACID transactions, and security (AuthN/AuthZ, Injection).
   - Look for N+1 queries.
4. **Execution:** Refactor the requested API endpoint or server logic. Output the robust backend code using the Critique -> Action -> Explanation format.
