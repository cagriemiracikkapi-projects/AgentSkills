#!/usr/bin/env python3
import argparse
from pathlib import Path


MODEL_PRICING = {
    "claude-3-5-sonnet": {"input_per_1m": 3.00, "output_per_1m": 15.00},
    "gpt-4o": {"input_per_1m": 5.00, "output_per_1m": 15.00},
    "gemini-1.5-pro": {"input_per_1m": 3.50, "output_per_1m": 10.50},
}


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def main():
    parser = argparse.ArgumentParser(description="Estimate prompt token count and monthly cost.")
    parser.add_argument("prompt_file", help="Prompt file path")
    parser.add_argument("--model", default="claude-3-5-sonnet", help="Model name")
    parser.add_argument("--requests-per-month", default=10000, type=int, help="Monthly request volume")
    parser.add_argument("--avg-output-tokens", default=500, type=int, help="Average output tokens per request")
    args = parser.parse_args()

    prompt = Path(args.prompt_file).read_text(encoding="utf-8")
    input_tokens = estimate_tokens(prompt)
    pricing = MODEL_PRICING.get(args.model.lower())
    if not pricing:
        raise SystemExit(f"Unknown model pricing profile: {args.model}")

    input_cost = (input_tokens * args.requests_per_month / 1_000_000) * pricing["input_per_1m"]
    output_cost = (args.avg_output_tokens * args.requests_per_month / 1_000_000) * pricing["output_per_1m"]

    print("💰 Prompt Cost Estimator")
    print(f"Model: {args.model}")
    print(f"Estimated input tokens/request: {input_tokens}")
    print(f"Estimated monthly input cost: ${input_cost:.2f}")
    print(f"Estimated monthly output cost: ${output_cost:.2f}")
    print(f"Estimated monthly total: ${input_cost + output_cost:.2f}")


if __name__ == "__main__":
    main()
