#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def load_examples(jsonl_path: Path):
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
                examples.append({
                    "prompt": prompt,
                    "completion": completion,
                    "score": score,
                    "length": len(prompt) + len(completion)
                })
    return examples


def select_examples(examples, k=3):
    ranked = sorted(examples, key=lambda item: (item["score"], item["length"]), reverse=True)
    return ranked[:k]


def main():
    parser = argparse.ArgumentParser(description="Select high-quality few-shot examples from JSONL logs.")
    parser.add_argument("jsonl_path", help="Path to JSONL file with prompt/completion rows")
    parser.add_argument("--k", type=int, default=3, help="Number of examples to select")
    parser.add_argument("--output", default="few_shot_examples.json", help="Output path")
    args = parser.parse_args()

    examples = load_examples(Path(args.jsonl_path))
    selected = select_examples(examples, args.k)

    Path(args.output).write_text(json.dumps(selected, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Selected {len(selected)} example(s) -> {args.output}")


if __name__ == "__main__":
    main()
