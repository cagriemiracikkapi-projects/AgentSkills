# Global AI Agent Rules & Constraints

## 1. Core Objectives
1. **Context Adherence:** Always operate strictly within the provided context. Do not output generic boilerplate or make assumptions outside the provided scope.
2. **Token Efficiency:** Maximize value while minimizing token usage. Be direct, concise, and eliminate unnecessary filler words or pleasantries.
3. **Role Adherence:** If a specific role or workflow is invoked (e.g., via `/audit` or `#file:.agents/roles/frontend.md`), strictly follow the constraints and focus areas defined in that role.

## 2. Git Commit Protocol
When the user says "Commit", you MUST generate a Git commit message following exactly this protocol:
- Use the formal Conventional Commits format with a specific subject.
- Format: `<type>(<scope>): <short summary>`
- The summary must be highly specific to the changes made and use the minimum number of tokens possible.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Example Output: `feat(auth): add JWT expiration validation` (NO extra text, NO pleasantries).

## 3. Output Format & Token Efficiency
- Output format must strictly adhere to the persona requested.
- **Zero fluff:** DO NOT use conversational fillers ("Here is the code", "I understand", "Let me help you with that").
- Just output the requested information directly.
- **Strict token economy:** Every character matters. Delete redundant comments, consolidate repetitive logic.

## 4. Cross-Tool Session Handoff (CLI Continues)
If the user switches IDEs or hits a rate limit (e.g., from Claude to Gemini using `npx continues`), your context will be structurally injected into the new session.
- Ensure your output and state (like creating summarized task files) are easy to read.
- Never complain about a lack of previous conversation history if you are injected into a new environment; just read the provided context and continue seamlessly.

## 5. Persistent Memory Stream (Agent-Mem Protocol)
To avoid massive token waste by re-reading identical files across multiple sessions, you MUST utilize a progressive memory system.
1. When a task is completed, a major architectural decision is made, or an important bug is resolved, write a compact, highly semantic summary of this event.
2. Append this summary to the project's memory file (typically `MEMORY.md` in the agent config directory). Create the directory/file if it doesn't exist.
3. At the start of a new session, ALWAYS read the memory file first to regain contextual awareness before asking the user redundant questions or searching the repository again.
4. **Explanation:** One concise sentence explaining *why* the change was made.

## 6. Context Manager — Platform-Spesifik Lookup Protokolü
"Query context manager" ifadesi agent rollerinde şu anlama gelir:
- **Claude Code (folder mode):** `Glob` ve `Grep` araçlarıyla `.claude/skills/` ve proje dosyalarını tara.
- **Gemini CLI:** `@file:` syntax ile dosya referansları ver. `.gemini/*.md` yüklü context için kontrol et.
- **Codex:** `AGENTS.md` dosya indeksini oku, ardından `.codex/*.md` rol dosyalarını oku.
- **Cursor/Windsurf:** Rules her zaman inject edilir; `@codebase` veya IDE file reference sistemini kullan.
- **Tüm platformlar:** Proje yapısından emin değilsen varsaymak yerine kullanıcıya tek hedefli soru sor.

## 7. Error Handling & Fallback
- Gerekli dosya veya context bulunamazsa şunu çıkar: `[CONTEXT MISSING: <filename>] — mevcut bilgiyle devam ediliyor.`
- Eksik configuration için asla sessizce varsayılan değer kullanma.
- Görev tamamlamak için eksik bilgi varsa, devam etmeden önce neyin eksik olduğunu açıkça belirt.

## 8. Token Budget Guidelines
- Context'te zaten bulunan içeriği tekrar etme.
- Flat mode'da (Gemini, Codex): Tüm skills önceden bundle'landı. Skills'e yalnızca adıyla referans ver; içeriğini yeniden açıklama.
- Verbose çıktıyı şunlar için kullan: code blocks, checklists, structured reports. Açıklamalar için kısa nesir.
- Hedef: kod çıktısı ≥ %60 response token; açıklayıcı nesir ≤ %40.
