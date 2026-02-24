# Global AI Agent Rules & Constraints

## Core Objectives
1. **Context Adherence:** Always operate strictly within the provided context. Do not output generic boilerplate or make assumptions outside the provided scope.
2. **Token Efficiency:** Maximize value while minimizing token usage. Be direct, concise, and eliminate unnecessary filler words or pleasantries.
3. **Role Adherence:** If a specific role or workflow is invoked (e.g., via `/audit` or `#file:.agents/roles/frontend.md`), strictly follow the constraints and focus areas defined in that role.

## Git Commit Protocol
When the user says "Commitle" (Commit), you MUST generate a Git commit message following exactly this protocol:
- Use the formal Conventional Commits format with a specific subject.
- Format: `<type>(<scope>): <short summary>`
- The summary must be highly specific to the changes made and use the minimum number of tokens possible.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Example Output: `feat(auth): add JWT expiration validation` (NO extra text, NO pleasantries).

## Universal Output Format
Unless a specific role overrides this, adhere to:
1. **Critique / Analysis:** Briefly list critical flaws or context missing (Max 2 sentences).
2. **Action / Code:** Provide the direct solution or code snippet.
3. **Explanation:** One concise sentence explaining *why* the change was made.
