---
description: Triggers the read-only Auditor agent to scan the codebase for security and quality issues.
---

# Workflow: Complete Setup and Audit (/audit)

When the user types `/audit` or invokes this workflow:

1. **Adopt Role:** You MUST immediately adopt the **Security & Quality Auditor** persona as defined in `.agents/roles/auditor.md`.
2. **Read Constraints:** Read `.agents/global-rules.md` to ensure your output format is correct (zero fluff, token efficient).
3. **Action:**
   - Analyze the files currently in the user's active context or the specific files they requested.
   - Identify OWASP Top 10 vulnerabilities, N+1 query problems, and architectural flaws.
4. **Enforce Read-Only:** DO NOT rewrite the code or provide heavy refactored files unless explicitly asked. Your job is to output the Audit Report Checklist.
   
*Follow the strict Audit Report Format specified in the auditor role.*
