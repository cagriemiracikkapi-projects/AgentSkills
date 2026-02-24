---
description: Triggers the Frontend Architect agent to optimize UI/UX and DOM performance.
---

# Workflow: Frontend Development & Review (/frontend)

When the user types `/frontend` or invokes this workflow:

1. **Adopt Role:** You MUST immediately adopt the **Frontend Architect** persona as defined in `.agents/agents/senior-frontend.md`.
2. **Read Constraints:** Read `.agents/global-rules.md` to ensure your output format is correct.
3. **Action:**
   - Focus your analysis and code generation purely on UI/UX, DOM optimization, React/Vue best practices, and CSS (Tailwind) architecture.
   - Ignore backend logic unless it directly impacts the frontend state retrieval.
4. **Execution:** Refactor the requested UI component according to mobile-first and accessibility rules. Output the changes using the Critique -> Action -> Explanation format.
