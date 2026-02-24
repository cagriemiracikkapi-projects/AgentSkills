#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter


DURATION_RE = re.compile(r"duration:\s*([0-9.]+)\s*ms", re.IGNORECASE)
STATEMENT_RE = re.compile(r"statement:\s*(.+)$", re.IGNORECASE)


def normalize_sql(sql: str) -> str:
    collapsed = re.sub(r"\s+", " ", sql.strip())
    collapsed = re.sub(r"'[^']*'", "?", collapsed)
    collapsed = re.sub(r"\b\d+\b", "?", collapsed)
    return collapsed.lower()


def analyze(log_file: str, threshold_ms: float, n1_threshold: int):
    slow_queries = []
    statements = []

    with open(log_file, "r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            duration_match = DURATION_RE.search(line)
            statement_match = STATEMENT_RE.search(line)
            if not duration_match or not statement_match:
                continue

            duration = float(duration_match.group(1))
            sql = statement_match.group(1).strip()
            statements.append(sql)

            if duration >= threshold_ms:
                slow_queries.append({
                    "duration_ms": duration,
                    "statement": sql
                })

    normalized_counter = Counter(normalize_sql(stmt) for stmt in statements)
    n_plus_one_candidates = [
        {"statement": stmt, "count": count}
        for stmt, count in normalized_counter.items()
        if count >= n1_threshold and "select" in stmt
    ]
    n_plus_one_candidates.sort(key=lambda item: item["count"], reverse=True)

    slow_queries.sort(key=lambda item: item["duration_ms"], reverse=True)
    summary = {
        "total_statements": len(statements),
        "slow_query_threshold_ms": threshold_ms,
        "slow_query_count": len(slow_queries),
        "slowest_queries": slow_queries[:20],
        "n_plus_one_candidates": n_plus_one_candidates[:20]
    }
    return summary


def print_report(summary):
    print("📈 Slow Query Analyzer")
    print(f"Total parsed statements: {summary['total_statements']}")
    print(f"Slow query count (>= {summary['slow_query_threshold_ms']}ms): {summary['slow_query_count']}")

    if summary["slowest_queries"]:
        print("\nTop slow queries:")
        for item in summary["slowest_queries"][:5]:
            print(f" - {item['duration_ms']:.2f}ms | {item['statement']}")
    else:
        print("\nNo slow queries above threshold were found.")

    if summary["n_plus_one_candidates"]:
        print("\nPotential N+1 candidates:")
        for item in summary["n_plus_one_candidates"][:5]:
            print(f" - repeated {item['count']}x | {item['statement']}")
    else:
        print("\nNo high-frequency SELECT patterns matched the N+1 threshold.")


def main():
    parser = argparse.ArgumentParser(description="Analyze SQL logs for slow queries and N+1 patterns.")
    parser.add_argument("--log-file", required=True, help="Path to SQL log file")
    parser.add_argument("--threshold", default=500.0, type=float, help="Slow query threshold in ms")
    parser.add_argument("--n-plus-one-threshold", default=20, type=int, help="Min repetition count for N+1 detection")
    parser.add_argument("--json", action="store_true", help="Output report as JSON")
    args = parser.parse_args()

    summary = analyze(args.log_file, args.threshold, args.n_plus_one_threshold)
    if args.json:
        print(json.dumps(summary, indent=2))
        return
    print_report(summary)


if __name__ == "__main__":
    main()
