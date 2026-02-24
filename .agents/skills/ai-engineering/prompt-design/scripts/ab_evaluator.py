#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path


def load_prompt(prompt_file: Path):
    return prompt_file.read_text(encoding="utf-8")


def load_dataset(dataset_path: Path):
    with dataset_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def score_prompt(prompt_text: str, rows):
    # Deterministic proxy score for offline comparison:
    # favor concise prompts that still include structural keywords.
    keywords = ["json", "schema", "format", "steps", "constraints"]
    keyword_hits = sum(1 for kw in keywords if kw in prompt_text.lower())
    avg_row_size = sum(len(" ".join(row.values())) for row in rows) / max(len(rows), 1)
    length_penalty = len(prompt_text) / max(avg_row_size, 1)
    score = (keyword_hits * 20) - length_penalty
    return round(score, 3)


def main():
    parser = argparse.ArgumentParser(description="Compare two prompt templates against an eval dataset.")
    parser.add_argument("prompt_a", help="Prompt A path")
    parser.add_argument("prompt_b", help="Prompt B path")
    parser.add_argument("--dataset", required=True, help="CSV dataset path")
    args = parser.parse_args()

    prompt_a = load_prompt(Path(args.prompt_a))
    prompt_b = load_prompt(Path(args.prompt_b))
    rows = load_dataset(Path(args.dataset))

    score_a = score_prompt(prompt_a, rows)
    score_b = score_prompt(prompt_b, rows)

    print("🧪 Prompt A/B Evaluator")
    print(f"Dataset rows: {len(rows)}")
    print(f"A score: {score_a}")
    print(f"B score: {score_b}")
    winner = "A" if score_a >= score_b else "B"
    print(f"Winner: {winner}")


if __name__ == "__main__":
    main()
