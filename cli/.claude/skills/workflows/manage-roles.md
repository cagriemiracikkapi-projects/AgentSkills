---
description: Dynamically analyzes the project stack and ignores irrelevant agent roles to save tokens.
---

# Workflow: Token Optimization Manager (/manage-roles)

When the user types `/manage-roles` or asks you to optimize skills/roles:

1. **Adopt Role:** You act as the **Skill Manager & System Architect**.
2. **Analysis:** Scan the root directory of the user's project to identify the tech stack:
   - Example triggers: `package.json` (Node/React), `Cargo.toml` (Rust), `*.xcodeproj` (iOS), `build.gradle` (Android).
3. **Evaluation:** Compare the detected stack against the roles in `.agents/roles/`.
   - *Example:* If the project is a Rust CLI, the `frontend.md` role is irrelevant.
   - *Example:* If the project is a static HTML page, the `database.md` role may be irrelevant.
4. **Action:**
   - Create or update a file named `.agents/.ignore` or document disabling rules at the top of the project's main prompt instruction file (like a local `.cursorrules` or `.claude.md`).
   - Write instructions explicitly telling the AI NOT to read the irrelevant roles in future iterations.
5. **Output:** Provide a brief summary to the user estimating how many tokens were saved by disabling those roles.
   
*Example Output:* "Disabled `frontend.md` and `database.md`. Estimated token savings per conversation: ~2,500."
