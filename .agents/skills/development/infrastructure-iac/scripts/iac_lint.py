#!/usr/bin/env python3
"""
IaC Linter — wraps checkov and tflint for unified severity-ranked output.

Usage:
    python iac_lint.py <terraform-dir> [--fail-on critical,high]

Requirements:
    pip install checkov
    npm install -g tflint  (or brew install tflint)
"""

import subprocess
import json
import sys
import argparse
from pathlib import Path

SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


def run_checkov(terraform_dir: str) -> list[dict]:
    result = subprocess.run(
        ["checkov", "-d", terraform_dir, "-o", "json", "--quiet"],
        capture_output=True, text=True
    )
    try:
        data = json.loads(result.stdout)
        checks = data.get("results", {}).get("failed_checks", [])
        return [
            {
                "tool": "checkov",
                "severity": c.get("severity", "MEDIUM").upper(),
                "check_id": c.get("check_id"),
                "check_name": c.get("check_name"),
                "file": c.get("file_path"),
                "lines": c.get("file_line_range"),
                "resource": c.get("resource"),
            }
            for c in checks
        ]
    except (json.JSONDecodeError, KeyError):
        return []


def run_tflint(terraform_dir: str) -> list[dict]:
    result = subprocess.run(
        ["tflint", "--chdir", terraform_dir, "--format", "json"],
        capture_output=True, text=True
    )
    try:
        data = json.loads(result.stdout)
        issues = data.get("issues", [])
        return [
            {
                "tool": "tflint",
                "severity": i.get("rule", {}).get("severity", "warning").upper(),
                "check_id": i.get("rule", {}).get("name"),
                "check_name": i.get("message"),
                "file": i.get("range", {}).get("filename"),
                "lines": [
                    i.get("range", {}).get("start", {}).get("line"),
                    i.get("range", {}).get("end", {}).get("line"),
                ],
                "resource": None,
            }
            for i in issues
        ]
    except (json.JSONDecodeError, KeyError):
        return []


def main():
    parser = argparse.ArgumentParser(description="IaC Linter: checkov + tflint")
    parser.add_argument("terraform_dir", help="Path to Terraform directory")
    parser.add_argument("--fail-on", default="critical", help="Comma-separated severities to fail on")
    args = parser.parse_args()

    fail_severities = {s.strip().upper() for s in args.fail_on.split(",")}
    findings = run_checkov(args.terraform_dir) + run_tflint(args.terraform_dir)
    findings.sort(key=lambda f: SEVERITY_ORDER.index(f["severity"]) if f["severity"] in SEVERITY_ORDER else 99)

    total = len(findings)
    critical_count = sum(1 for f in findings if f["severity"] in fail_severities)

    print(f"\n{'='*60}")
    print(f"IaC Lint Report — {args.terraform_dir}")
    print(f"Total findings: {total} | Blocking ({','.join(fail_severities)}): {critical_count}")
    print(f"{'='*60}\n")

    for f in findings:
        lines = f.get("lines") or []
        line_str = f"{lines[0]}-{lines[1]}" if len(lines) == 2 else str(lines[0]) if lines else "?"
        print(f"[{f['severity']:8}] {f['tool']:8} | {f['check_id']} | {f['file']}:{line_str}")
        print(f"           {f['check_name']}")
        if f.get("resource"):
            print(f"           Resource: {f['resource']}")
        print()

    if critical_count > 0:
        print(f"FAILED: {critical_count} blocking finding(s). Fix before merge.")
        sys.exit(1)

    print("PASSED: No blocking findings.")


if __name__ == "__main__":
    main()
