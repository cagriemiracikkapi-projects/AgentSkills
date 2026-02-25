---
name: ai-engineering/prompt-design
description: Complete toolkit for establishing evaluation frameworks, generating few-shot examples, and optimizing system prompts for Claude, GPT, Gemini, and Llama. Use this skill to reduce hallucinations and minimize token cost in production AI systems.
---

# Skill: Prompt Design & AI Engineering

Guidelines and tools for conducting systematic, mathematical prompt optimization.

## Quick Start

> **Script Paths:** Gemini/Codex/cursorlike: `.agent_scripts/ai-engineering_prompt-design/`. Claude (folder mode): `.claude/skills/ai-engineering/prompt-design/scripts/`.

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Prompt Token Cost Estimator
python .agent_scripts/ai-engineering_prompt-design/cost_estimator.py [options]

# Script 2: Few-Shot Example Generator
python .agent_scripts/ai-engineering_prompt-design/few_shot_generator.py [options]

# Script 3: A/B Test Evaluator
python .agent_scripts/ai-engineering_prompt-design/ab_evaluator.py [options]
```

## Core Capabilities

### 1. Cost Estimator

Calculates the exact token footprint of a specific prompt template against various models (Claude Sonnet 4.6, GPT-4o, Gemini 2.0 Flash) based on their specific tokenizers.

**Features:**
- Highlights the most expensive context blocks.
- Projects monthly cost based on expected request volume.

**Usage:**
```bash
python .agent_scripts/ai-engineering_prompt-design/cost_estimator.py ./prompts/customer_support.txt --model claude-sonnet-4-6
```

### 2. Few-Shot Generator

Scans a database of historical user completions and extracts the three most diverse, high-quality examples to inject into a Prompt Template to stabilize output formatting.

**Usage:**
```bash
python .agent_scripts/ai-engineering_prompt-design/few_shot_generator.py ./logs/completions.jsonl
```

### 3. A/B Test Evaluator

Runs two different prompt strings against a dataset of 50 ground-truth examples and outputs the accuracy delta and latency comparison.

**Usage:**
```bash
python .agent_scripts/ai-engineering_prompt-design/ab_evaluator.py ./prompts/v1.txt ./prompts/v2.txt --dataset ./evals/set_a.csv
```

## Reference Documentation

### 1. Cost & Token Optimization (`references/token_optimization.md`)
- Why converting JSON context to XML saves tokens in Anthropic models.
- Context pruning and summarization strategies.

### 2. Guardrails & Structural Output (`references/structural_output.md`)
- Using JSON Schema vs `<json></json>` tags.
- Constitutional AI and Self-Correction.

## The A/B Testing Rule
Never assume a prompt is "better" just because it looks cleaner to a human. Run an eval set. An ugly prompt that scores 98% accuracy on the test set is better than a beautiful prompt that scores 91%.
