#!/usr/bin/env python3
"""Select high-quality, diverse few-shot examples from JSONL completion logs."""
import argparse
import json
from pathlib import Path


def load_examples(jsonl_path: Path) -> list[dict]:
    examples = []
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            prompt = row.get("prompt")
            completion = row.get("completion")
            score = float(row.get("score", 0))
            if prompt and completion:
                total_len = len(prompt) + len(completion)
                examples.append({
                    "prompt": prompt,
                    "completion": completion,
                    "score": score,
                    "length": total_len,
                })
    return examples


def _jaccard(a: str, b: str) -> float:
    """Compute word-level Jaccard similarity between two strings."""
    set_a = set(a.lower().split())
    set_b = set(b.lower().split())
    if not set_a or not set_b:
        return 0.0
    inter = len(set_a & set_b)
    union = len(set_a | set_b)
    return inter / union


def _length_score(length: int, median: float) -> float:
    """Normalize length: penalize extremes. Peak at median."""
    if median <= 0:
        return 1.0
    ratio = length / median
    # Gaussian-like penalty: score drops off from ratio=1
    if ratio < 0.2 or ratio > 5.0:
        return 0.0
    if ratio < 0.5:
        return ratio * 2.0
    if ratio > 2.5:
        return max(0.0, 1.0 - (ratio - 2.5) / 2.5)
    return 1.0


def select_examples(examples: list[dict], k: int = 3) -> list[dict]:
    if not examples:
        return []

    lengths = sorted(e["length"] for e in examples)
    median_len = lengths[len(lengths) // 2]

    # Score = normalized_quality_score * length_factor
    for ex in examples:
        len_factor = _length_score(ex["length"], median_len)
        ex["_composite"] = ex["score"] * (0.7 + 0.3 * len_factor)

    # Sort by composite score descending
    candidates = sorted(examples, key=lambda x: x["_composite"], reverse=True)

    # Greedy diversity selection: pick next candidate that is least similar to already-picked ones
    selected: list[dict] = []
    for candidate in candidates:
        if len(selected) >= k:
            break
        if not selected:
            selected.append(candidate)
            continue
        # Check Jaccard similarity against all selected
        max_similarity = max(
            _jaccard(candidate["prompt"] + candidate["completion"],
                     s["prompt"] + s["completion"])
            for s in selected
        )
        # Reject if too similar (> 0.6 similarity = likely duplicate)
        if max_similarity < 0.6:
            selected.append(candidate)

    # Fallback: if diversity filter reduced below k, fill from top candidates
    if len(selected) < k:
        for candidate in candidates:
            if candidate not in selected:
                selected.append(candidate)
            if len(selected) >= k:
                break

    return selected


def main():
    parser = argparse.ArgumentParser(
        description="Select high-quality, diverse few-shot examples from JSONL logs."
    )
    parser.add_argument("jsonl_path", help="JSONL file with prompt/completion rows")
    parser.add_argument("--k", type=int, default=3, help="Number of examples to select")
    parser.add_argument("--output", default="few_shot_examples.json", help="Output path")
    args = parser.parse_args()

    examples = load_examples(Path(args.jsonl_path))
    if not examples:
        raise SystemExit("No valid examples found in JSONL file.")

    print(f"Loaded {len(examples)} examples.")
    selected = select_examples(examples, args.k)

    # Clean internal fields before output
    for ex in selected:
        ex.pop("_composite", None)

    Path(args.output).write_text(
        json.dumps(selected, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"✅ Selected {len(selected)} example(s) → {args.output}")
    for i, ex in enumerate(selected, 1):
        print(f"  [{i}] score={ex['score']:.2f} len={ex['length']}  prompt: {ex['prompt'][:60]}...")


if __name__ == "__main__":
    main()
