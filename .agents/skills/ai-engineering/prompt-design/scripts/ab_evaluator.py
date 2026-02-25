#!/usr/bin/env python3
"""Compare two prompt templates with dataset-based scoring, latency estimates, and per-example breakdown."""
import argparse
import csv
from pathlib import Path


EVAL_KEYWORDS = ["json", "schema", "format", "steps", "constraints", "output", "example", "task"]
# Rough tokens-per-second for latency estimation (input-only heuristic)
TOKENS_PER_SECOND = 1500


def estimate_tokens(text: str) -> int:
    """Word-count × 1.33 heuristic."""
    return max(1, round(len(text.split()) * 1.33))


def estimate_latency_ms(tokens: int) -> float:
    """Approximate Time-to-First-Token based on prompt size."""
    return (tokens / TOKENS_PER_SECOND) * 1000.0


def score_prompt_for_row(prompt_text: str, row: dict) -> float:
    """
    Per-row score:
    - Keyword coverage: how many eval keywords appear in the prompt
    - Length fit: penalize very long prompts relative to row context size
    """
    prompt_lower = prompt_text.lower()
    row_text = " ".join(str(v) for v in row.values())

    keyword_hits = sum(1 for kw in EVAL_KEYWORDS if kw in prompt_lower)
    keyword_score = keyword_hits / len(EVAL_KEYWORDS)

    # Length penalty relative to row size
    prompt_len = len(prompt_text)
    row_len = max(len(row_text), 1)
    length_ratio = prompt_len / row_len
    if length_ratio < 0.5:
        length_score = 0.6  # too short
    elif length_ratio > 10.0:
        length_score = 0.4  # bloated
    else:
        length_score = 1.0

    return round((keyword_score * 0.7 + length_score * 0.3) * 100, 1)


def evaluate(prompt_text: str, rows: list[dict]) -> dict:
    per_row = [score_prompt_for_row(prompt_text, row) for row in rows]
    avg = sum(per_row) / len(per_row) if per_row else 0.0
    tokens = estimate_tokens(prompt_text)
    latency = estimate_latency_ms(tokens)
    return {
        "per_row": per_row,
        "avg_score": round(avg, 2),
        "tokens": tokens,
        "estimated_latency_ms": round(latency, 1),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Compare two prompt templates against an eval dataset."
    )
    parser.add_argument("prompt_a", help="Prompt A path")
    parser.add_argument("prompt_b", help="Prompt B path")
    parser.add_argument("--dataset", required=True, help="CSV dataset path")
    parser.add_argument("--show-breakdown", action="store_true",
                        help="Show per-example score comparison")
    args = parser.parse_args()

    prompt_a = Path(args.prompt_a).read_text(encoding="utf-8")
    prompt_b = Path(args.prompt_b).read_text(encoding="utf-8")

    with Path(args.dataset).open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        raise SystemExit("Dataset is empty.")

    result_a = evaluate(prompt_a, rows)
    result_b = evaluate(prompt_b, rows)

    print("🧪 Prompt A/B Evaluator")
    print(f"Dataset rows:  {len(rows)}")
    print(f"Keywords used: {', '.join(EVAL_KEYWORDS)}\n")

    print(f"{'Metric':<30} {'A':>10} {'B':>10}")
    print("-" * 52)
    print(f"{'Avg score (0-100)':<30} {result_a['avg_score']:>10.1f} {result_b['avg_score']:>10.1f}")
    print(f"{'Input tokens (est.)':<30} {result_a['tokens']:>10,} {result_b['tokens']:>10,}")
    print(f"{'Est. TTFT latency (ms)':<30} {result_a['estimated_latency_ms']:>10.0f} {result_b['estimated_latency_ms']:>10.0f}")

    diff = result_a["avg_score"] - result_b["avg_score"]
    significance = "significant" if abs(diff) > 5.0 else "not significant"
    winner = "A" if result_a["avg_score"] >= result_b["avg_score"] else "B"

    print(f"\nScore difference: {diff:+.1f} ({significance})")
    print(f"Winner: Prompt {winner}")

    if result_b["tokens"] < result_a["tokens"] * 0.8:
        print("ℹ️  Prompt B is significantly shorter — may reduce cost per request.")
    if result_a["tokens"] < result_b["tokens"] * 0.8:
        print("ℹ️  Prompt A is significantly shorter — may reduce cost per request.")

    if args.show_breakdown:
        print(f"\nPer-example breakdown ({min(len(rows), 20)} rows shown):")
        print(f"  {'Row':<5} {'A score':>8} {'B score':>8} {'Better':>8}")
        for i, (sa, sb) in enumerate(zip(result_a["per_row"], result_b["per_row"])):
            if i >= 20:
                break
            better = "A" if sa >= sb else "B"
            print(f"  {i+1:<5} {sa:>8.1f} {sb:>8.1f} {better:>8}")


if __name__ == "__main__":
    main()
