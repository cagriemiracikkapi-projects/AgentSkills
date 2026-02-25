#!/usr/bin/env python3
import argparse
import re
from pathlib import Path


RISKY_PATTERNS = [
    ("HIGH", re.compile(r"\bdrop\s+table\b", re.IGNORECASE), "DROP TABLE detected."),
    ("HIGH", re.compile(r"\bdrop\s+column\b", re.IGNORECASE), "DROP COLUMN detected."),
    ("HIGH", re.compile(r"\balter\s+table\b.*\bmodify\s+column\b", re.IGNORECASE), "MODIFY COLUMN detected — type change may truncate data or cause lock."),
    ("MED", re.compile(r"\brename\s+column\b", re.IGNORECASE), "RENAME COLUMN detected — breaks compatibility with existing queries/ORMs."),
    ("MED", re.compile(r"\balter\s+table\b.*\badd\s+column\b.*\bdefault\b", re.IGNORECASE), "ADD COLUMN with DEFAULT may lock large tables."),
    ("MED", re.compile(r"\bcreate\s+index\b(?!.*concurrently)", re.IGNORECASE), "CREATE INDEX without CONCURRENTLY — locks table during index build on large tables."),
]


def find_migrations(target: Path):
    if target.is_file():
        return [target]
    return [
        path for path in target.rglob("*")
        if path.suffix.lower() in {".sql", ".py", ".ts", ".js"}
    ]


def analyze_file(file_path: Path):
    findings = []
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    for severity, pattern, message in RISKY_PATTERNS:
        for match in pattern.finditer(content):
            line = content[: match.start()].count("\n") + 1
            findings.append({
                "severity": severity,
                "message": message,
                "line": line,
                "snippet": match.group(0)[:160]
            })
    return findings


def main():
    parser = argparse.ArgumentParser(description="Validate migration files for risky operations.")
    parser.add_argument("target", help="Migration file or directory")
    args = parser.parse_args()

    target = Path(args.target)
    if not target.exists():
        raise SystemExit(f"Target does not exist: {target}")

    files = find_migrations(target)
    total = 0
    print(f"🔎 Scanning {len(files)} migration file(s)...")
    for file_path in files:
        findings = analyze_file(file_path)
        if findings:
            print(f"\n{file_path}")
        for finding in findings:
            total += 1
            print(f" - [{finding['severity']}] line {finding['line']}: {finding['message']}")
            print(f"   {finding['snippet']}")

    if total == 0:
        print("✅ No risky migration pattern found.")
    else:
        print(f"\n⚠️ Total findings: {total}")


if __name__ == "__main__":
    main()
