#!/usr/bin/env python3
import argparse
from pathlib import Path


MODEL_PRICING = {
    "claude-sonnet-4-6": {"input_per_1m": 3.00, "output_per_1m": 15.00},
    "claude-opus-4-6": {"input_per_1m": 15.00, "output_per_1m": 75.00},
    "gpt-4o": {"input_per_1m": 2.50, "output_per_1m": 10.00},
    "gemini-3.1-pro": {"input_per_1m": 2.00, "output_per_1m": 12.00},
    "gemini-3.1-pro-preview": {"input_per_1m": 2.00, "output_per_1m": 12.00},
}

# Legacy aliases
MODEL_PRICING["claude-3-5-sonnet"] = MODEL_PRICING["claude-sonnet-4-6"]


def estimate_tokens(text: str) -> int:
    """Estimate token count using word-count × 1.33 heuristic (tiktoken-like, stdlib only)."""
    words = len(text.split())
    return max(1, round(words * 1.33))


def main():
    parser = argparse.ArgumentParser(description="Estimate prompt token count and monthly cost.")
    parser.add_argument("prompt_file", help="Prompt file path")
    parser.add_argument("--model", default="claude-sonnet-4-6",
                        help=f"Model name. Available: {', '.join(MODEL_PRICING)}")
    parser.add_argument("--requests-per-month", default=10000, type=int, help="Monthly request volume")
    parser.add_argument("--requests-per-day", type=int,
                        help="Daily request volume (converted to monthly automatically)")
    parser.add_argument("--avg-output-tokens", default=500, type=int,
                        help="Average output tokens per request")
    args = parser.parse_args()

    prompt = Path(args.prompt_file).read_text(encoding="utf-8")
    input_tokens = estimate_tokens(prompt)

    monthly_requests = args.requests_per_month
    if args.requests_per_day is not None:
        monthly_requests = args.requests_per_day * 30

    model_key = args.model.lower()
    pricing = MODEL_PRICING.get(model_key)
    if not pricing:
        avail = ", ".join(sorted(MODEL_PRICING))
        raise SystemExit(f"Unknown model pricing profile: {args.model}\nAvailable: {avail}")

    input_cost = (input_tokens * monthly_requests / 1_000_000) * pricing["input_per_1m"]
    output_cost = (args.avg_output_tokens * monthly_requests / 1_000_000) * pricing["output_per_1m"]
    total = input_cost + output_cost

    words = len(prompt.split())
    chars = len(prompt)

    print("💰 Prompt Cost Estimator")
    print(f"Model:                  {args.model}")
    print(f"Prompt characters:      {chars:,}")
    print(f"Prompt words:           {words:,}")
    print(f"Estimated input tokens: {input_tokens:,}  (words × 1.33)")
    print(f"Avg output tokens:      {args.avg_output_tokens:,}")
    print(f"Monthly requests:       {monthly_requests:,}")
    print(f"")
    print(f"Input  cost/month:      ${input_cost:,.2f}  (${pricing['input_per_1m']:.2f}/1M)")
    print(f"Output cost/month:      ${output_cost:,.2f}  (${pricing['output_per_1m']:.2f}/1M)")
    print(f"Total  cost/month:      ${total:,.2f}")
    print(f"Cost per request:       ${total / monthly_requests:.5f}")


if __name__ == "__main__":
    main()
