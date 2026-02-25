---
description: Dynamically analyzes the project stack and ignores irrelevant agent roles to save tokens.
---

# Workflow: Token Optimization Manager (/manage-roles)

When the user types `/manage-roles` or asks you to optimize skills/roles:

1. **Adopt Role:** You act as the **Skill Manager & System Architect**.
2. **Analysis:** Scan the root directory of the user's project to identify the tech stack:
   - Example triggers: `package.json` (Node/React), `Cargo.toml` (Rust), `*.xcodeproj` (iOS), `build.gradle` (Android).
3. **Evaluation:** Compare the detected stack against the installed agent roles.
   - *Example:* If the project is a Rust CLI, the `senior-frontend` role is irrelevant.
   - *Example:* If the project is a static HTML page, database-related roles may be irrelevant.
4. **Action:**
   - Domain-based installs için: `npx agentskills init --domain <domain> --ai <platform>` komutunu çalıştırarak yalnızca ilgili rolleri yeniden kur.
   - Manuel suppression için: `.claude/CLAUDE.md`, `.gemini/GEMINI.md` veya `.cursorrules` dosyasına AI'a hangi rol dosyalarını yoksayacağını söyleyen bir yorum satırı ekle.
   - `.agents/.ignore` OLUŞTURMA — bu dosya AgentSkills CLI tarafından okunmuyor.
5. **Output:** Provide a brief summary to the user listing the disabled roles.
