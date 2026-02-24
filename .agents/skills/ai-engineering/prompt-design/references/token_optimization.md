# Token Optimization

## Core Tactics
- Keep system prompts stable and short; move variable instructions to user prompts.
- Use compact schemas and avoid repeating examples across messages.
- Prefer structured keys over long prose when the output is machine-consumed.

## Workflow
1. Measure baseline token count.
2. Remove repeated guidance blocks.
3. Move long examples to optional few-shot packs.
4. Re-measure and verify output quality with eval data.

## Practical Checks
- Eliminate duplicated policy text.
- Replace verbose transitions with direct constraints.
- Keep critical safety constraints explicit even when compressing.
