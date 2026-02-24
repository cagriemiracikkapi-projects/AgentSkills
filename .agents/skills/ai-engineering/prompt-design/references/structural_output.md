# Structural Output

## Objective
Ensure prompts produce deterministic, parseable output under variance.

## Preferred Pattern
- Define output schema early in the prompt.
- List strict keys and accepted value types.
- Add one valid and one invalid example.

## Guardrails
- Reject free-form prose when schema is required.
- Require explicit error key for failed outputs.
- Validate response before downstream processing.

## Validation Checklist
1. Output is valid JSON/YAML.
2. All required fields are present.
3. No unexpected keys in strict mode.
4. Error cases preserve schema.
