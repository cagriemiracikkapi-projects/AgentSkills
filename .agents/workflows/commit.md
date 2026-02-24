---
description: Generates a highly concise, token-efficient Conventional Commit message.
---

# Workflow: Git Commit Generator (/commit)

When the user types `/commit` or asks you to generate a commit message:

1. **Read Constraints:** Read `.agents/global-rules.md` immediately. You MUST adhere to the "Git Commit Protocol".
2. **Action:** Analyze the `git diff` or the changes provided by the user.
3. **Execution:** Output ONLY the commit message in the format `<type>(<scope>): <summary>`.
4. **Restriction:** Do not output any preamble like "Here is your commit message:". Do not explain the commit unless the user explicitly added `?` or asked for an explanation.

**Example output:**
`fix(api): resolve N+1 query in user lookup`
