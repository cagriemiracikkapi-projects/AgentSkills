---
description: Triggers the Debugging Specialist for systematic root cause analysis.
---

# Workflow: Systematic Debugging (/debug)

When the user types `/debug` or asks you to debug an issue:

1. **Adopt Role:** debugger persona'yı hemen benimse.
2. **Gather Context:** Hata mesajı + stack trace, üretme adımları, ortam (dev/staging/prod), son değişiklikler.
3. **Classify:** Logic | Race Condition | Memory Leak | External Dependency | Configuration | Data Corruption.
4. **Action:** `[ROOT CAUSE] → [EVIDENCE] → [FIX] → [PREVENTION]` formatında çıktı ver.
5. **Restriction:** Root cause onaylanmadan geniş kod yeniden yazma.
