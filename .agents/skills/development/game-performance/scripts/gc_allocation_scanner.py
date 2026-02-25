#!/usr/bin/env python3
"""Scan Unity C# scripts for GC allocation patterns in hot paths (Update, FixedUpdate, LateUpdate)."""
import argparse
import re
import sys
from pathlib import Path


HOT_METHODS = {"Update", "FixedUpdate", "LateUpdate", "OnGUI", "OnCollisionEnter", "OnTriggerEnter"}

PATTERNS = [
    {
        "id": "string-concat-update",
        "severity": "HIGH",
        "regex": re.compile(r'["\w]\s*\+\s*\w'),
        "message": "String concatenation in hot path allocates a new string per frame.",
        "fix": "Use StringBuilder or TextMeshPro.SetText(format, value).",
    },
    {
        "id": "linq-in-hot-path",
        "severity": "HIGH",
        "regex": re.compile(r"\.\s*(?:Where|Select|OrderBy|OrderByDescending|FirstOrDefault|ToList|ToArray|Any|Count)\s*\("),
        "message": "LINQ usage allocates IEnumerator and intermediate collections per call.",
        "fix": "Replace with a standard for/foreach loop.",
    },
    {
        "id": "array-alloc-hot-path",
        "severity": "MED",
        "regex": re.compile(r"new\s+\w+\["),
        "message": "Array allocation inside hot path causes GC pressure.",
        "fix": "Pre-allocate array as a field and reuse; or use ArrayPool<T>.",
    },
    {
        "id": "get-component-hot-path",
        "severity": "MED",
        "regex": re.compile(r"GetComponent\s*<"),
        "message": "GetComponent<T>() inside hot path is slow (O(n) component search).",
        "fix": "Cache the component reference in Start() or Awake().",
    },
    {
        "id": "find-object-hot-path",
        "severity": "HIGH",
        "regex": re.compile(r"(?:FindObjectOfType|FindObjectsOfType|GameObject\.Find)\s*[<(]"),
        "message": "Find/FindObjectOfType inside hot path scans all scene objects.",
        "fix": "Cache reference in Start() or use a static singleton.",
    },
    {
        "id": "object-instantiate",
        "severity": "MED",
        "regex": re.compile(r"Instantiate\s*\("),
        "message": "Instantiate() inside hot path causes GC allocation.",
        "fix": "Use an ObjectPool pattern instead.",
    },
]


def extract_method_body(content: str, method_name: str) -> list[tuple[int, str]]:
    """Find method body lines for a given method name. Returns [(line_no, line_text), ...]."""
    method_re = re.compile(
        rf"\b(?:void|IEnumerator)\s+{re.escape(method_name)}\s*\([^)]*\)\s*\{{",
    )
    m = method_re.search(content)
    if not m:
        return []

    start_brace = m.end() - 1
    pos = start_brace + 1
    depth = 1
    while pos < len(content) and depth > 0:
        if content[pos] == "{":
            depth += 1
        elif content[pos] == "}":
            depth -= 1
        pos += 1

    body = content[start_brace:pos]
    prefix = content[:m.start()]
    start_line = prefix.count("\n") + 1

    result = []
    for i, line in enumerate(body.splitlines()):
        result.append((start_line + i, line))
    return result


def scan_file(file_path: Path) -> list[dict]:
    findings = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return findings

    for method_name in HOT_METHODS:
        body_lines = extract_method_body(content, method_name)
        if not body_lines:
            continue

        for line_no, line_text in body_lines:
            stripped = line_text.strip()
            if not stripped or stripped.startswith("//"):
                continue
            for pattern in PATTERNS:
                if pattern["regex"].search(stripped):
                    findings.append({
                        "file": str(file_path),
                        "line": line_no,
                        "method": method_name,
                        "severity": pattern["severity"],
                        "id": pattern["id"],
                        "message": pattern["message"],
                        "fix": pattern["fix"],
                        "snippet": stripped[:120],
                    })

    return findings


def main():
    parser = argparse.ArgumentParser(
        description="Scan Unity C# scripts for GC allocation patterns in hot paths."
    )
    parser.add_argument("target", nargs="?", default="Assets",
                        help="Directory or .cs file to scan (default: Assets)")
    parser.add_argument("--severity", choices=["HIGH", "MED", "ALL"], default="ALL",
                        help="Minimum severity to report (default: ALL)")
    args = parser.parse_args()

    root = Path(args.target)
    if not root.exists():
        raise SystemExit(f"Target does not exist: {root}")

    files = list(root.rglob("*.cs")) if root.is_dir() else [root]
    print("🔬 GC Allocation Scanner")
    print(f"Scanning {len(files)} C# file(s) in: {root}")
    print(f"Hot methods: {', '.join(sorted(HOT_METHODS))}\n")

    all_findings = []
    for f in files:
        all_findings.extend(scan_file(f))

    if args.severity == "HIGH":
        all_findings = [f for f in all_findings if f["severity"] == "HIGH"]
    elif args.severity == "MED":
        all_findings = [f for f in all_findings if f["severity"] in ("HIGH", "MED")]

    if not all_findings:
        print("✅ No GC allocation patterns detected in hot paths.")
        sys.exit(0)

    by_severity = {"HIGH": [], "MED": []}
    for finding in all_findings:
        by_severity.setdefault(finding["severity"], []).append(finding)

    for sev in ("HIGH", "MED"):
        for finding in by_severity.get(sev, []):
            print(f"⚠️  [{finding['severity']}] {finding['id']}")
            print(f"   File:    {finding['file']}:{finding['line']}")
            print(f"   Method:  {finding['method']}()")
            print(f"   Issue:   {finding['message']}")
            print(f"   Fix:     {finding['fix']}")
            print(f"   Code:    {finding['snippet']}")
            print()

    print(f"Total findings: {len(all_findings)}")
    sys.exit(1)


if __name__ == "__main__":
    main()
